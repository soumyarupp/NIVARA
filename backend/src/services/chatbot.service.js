/**
 * NIVARA Chatbot & Natural Language Query Service
 * Safely parses natural language infrastructure queries into structured intents and returns vetted query responses.
 */

import { Project } from '../models/Project.js';
import { Alert } from '../models/Alert.js';
import { MonthlyReport } from '../models/MonthlyReport.js';

const KNOWN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

const KNOWN_SECTORS = [
  'ROAD', 'RAILWAYS', 'POWER', 'PETROLEUM', 'COAL', 'TELECOM',
  'URBAN_DEVELOPMENT', 'SHIPPING_PORTS', 'CIVIL_AVIATION', 'WATER_RESOURCES', 'MINING'
];

/**
 * Extracts structured intent and safe filter criteria from natural language queries.
 * @param {string} text
 * @returns {Object} { intent, filters }
 */
export function parseChatbotIntent(text = '') {
  const query = text.toLowerCase().trim();
  const filters = {};

  // Detect State
  for (const st of KNOWN_STATES) {
    if (query.includes(st.toLowerCase())) {
      filters.state = st;
      break;
    }
  }

  // Detect Sector
  if (query.includes('road') || query.includes('highway') || query.includes('expressway')) {
    filters.sector = 'ROAD';
  } else if (query.includes('rail') || query.includes('railway') || query.includes('track') || query.includes('station')) {
    filters.sector = 'RAILWAYS';
  } else if (query.includes('power') || query.includes('solar') || query.includes('hydro') || query.includes('thermal') || query.includes('grid')) {
    filters.sector = 'POWER';
  } else if (query.includes('port') || query.includes('shipping')) {
    filters.sector = 'SHIPPING_PORTS';
  } else if (query.includes('airport') || query.includes('aviation')) {
    filters.sector = 'CIVIL_AVIATION';
  } else if (query.includes('urban') || query.includes('metro') || query.includes('smart city')) {
    filters.sector = 'URBAN_DEVELOPMENT';
  }

  // Detect Risk Level
  if (query.includes('critical risk') || query.includes('critical')) {
    filters.riskLevel = 'CRITICAL';
  } else if (query.includes('high risk') || query.includes('high-risk') || query.includes('high')) {
    filters.riskLevel = 'HIGH';
  } else if (query.includes('medium risk') || query.includes('moderate risk')) {
    filters.riskLevel = 'MEDIUM';
  } else if (query.includes('low risk')) {
    filters.riskLevel = 'LOW';
  }

  // Detect Cost thresholds (e.g. "above 500 crore", "under 1000 crore", "greater than 800")
  const aboveMatch = query.match(/(?:above|greater than|over|more than|min|minimum)\s+(\d+)(?:\s*cr|\s*crore)?/i);
  if (aboveMatch) {
    filters.minCost = Number(aboveMatch[1]);
  }

  const belowMatch = query.match(/(?:below|less than|under|max|maximum)\s+(\d+)(?:\s*cr|\s*crore)?/i);
  if (belowMatch) {
    filters.maxCost = Number(belowMatch[1]);
  }

  // Determine Primary Intent
  let intent = 'SEARCH_PROJECTS';

  if (query.includes('delay summary') || query.includes('why delayed') || query.includes('delay reason')) {
    intent = 'DELAY_SUMMARY';
  } else if (query.includes('risk summary') || query.includes('risk breakdown')) {
    intent = 'RISK_SUMMARY';
  } else if (query.includes('dashboard summary') || query.includes('overview') || query.includes('national summary')) {
    intent = 'DASHBOARD_SUMMARY';
  } else if (query.includes('send alert') || query.includes('trigger alert')) {
    intent = 'SEND_ALERT';
  } else if (query.includes('detail') || query.includes('project status for') || query.includes('project code')) {
    intent = 'PROJECT_DETAILS';
  }

  return { intent, filters };
}

/**
 * Executes a safe, vetted query corresponding to the extracted intent.
 * @param {string} userQuery
 * @returns {Promise<Object>}
 */
export async function executeChatbotQuery(userQuery = '') {
  const { intent, filters } = parseChatbotIntent(userQuery);

  if (intent === 'DASHBOARD_SUMMARY') {
    const totalProjects = await Project.countDocuments();
    const ongoingProjects = await Project.countDocuments({ projectStatus: 'ONGOING' });
    const highRiskProjects = await Project.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } });
    const criticalAlerts = await Alert.countDocuments({ severity: 'CRITICAL', status: 'ACTIVE' });

    return {
      success: true,
      intent,
      filters,
      response: `NIVARA currently tracks ${totalProjects} national infrastructure projects. There are ${ongoingProjects} ongoing projects, ${highRiskProjects} flagged with High/Critical risk, and ${criticalAlerts} active critical alerts requiring immediate inter-ministerial attention.`,
      data: { totalProjects, ongoingProjects, highRiskProjects, criticalAlerts }
    };
  }

  if (intent === 'DELAY_SUMMARY') {
    const delayStats = await MonthlyReport.aggregate([
      { $match: { autoDetectedDelayReason: { $ne: 'NONE' } } },
      { $group: { _id: '$autoDetectedDelayReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      success: true,
      intent,
      filters,
      response: `The primary systemic delay factors identified across active infrastructure projects include: ${delayStats
        .map((d) => `${d._id} (${d.count} instances)`)
        .join(', ')}.`,
      data: delayStats
    };
  }

  // Default: SEARCH_PROJECTS or PROJECT_DETAILS
  const mongoQuery = {};

  if (filters.state) {
    mongoQuery.state = { $regex: new RegExp(filters.state, 'i') };
  }
  if (filters.sector) {
    mongoQuery.sector = filters.sector;
  }
  if (filters.riskLevel) {
    mongoQuery.riskLevel = filters.riskLevel;
  }
  if (filters.minCost || filters.maxCost) {
    mongoQuery.originalProjectCost = {};
    if (filters.minCost) mongoQuery.originalProjectCost.$gte = filters.minCost;
    if (filters.maxCost) mongoQuery.originalProjectCost.$lte = filters.maxCost;
  }

  const projects = await Project.find(mongoQuery)
    .populate('ministryId', 'name code')
    .populate('implementationAgencyId', 'name agencyCode')
    .populate('nodalOfficer', 'name fullName officialEmail phone')
    .limit(10)
    .lean();

  let responseText = '';
  if (projects.length === 0) {
    responseText = `No projects found matching the criteria: ${JSON.stringify(filters)}.`;
  } else {
    responseText = `Found ${projects.length} project(s) matching your query: \n` +
      projects
        .map(
          (p) =>
            `• ${p.projectName} (${p.projectCode}) - Sector: ${p.sector}, State: ${p.state || 'N/A'}, Cost: ₹${p.originalProjectCost} Cr, Risk: ${p.riskLevel} (${p.riskScore}/100)`
        )
        .join('\n');
  }

  return {
    success: true,
    intent,
    filters,
    count: projects.length,
    response: responseText,
    data: projects
  };
}
