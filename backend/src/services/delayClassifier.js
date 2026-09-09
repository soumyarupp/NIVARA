/**
 * NIVARA Natural Language Delay Classifier
 * Classifies reported project delay reasons into standardized MoSPI categories.
 * Supports external Python ML service fallback with rule-based keyword extraction.
 */

const KEYWORD_DICTIONARY = {
  FOREST_CLEARANCE: [
    'forest',
    'forest clearance',
    'deforestation',
    'wildlife clearance',
    'tree cutting',
    'afforestation',
    'moef',
    'moefcc',
    'national park',
    'sanctuary',
    'dfo'
  ],
  ENVIRONMENTAL_CLEARANCE: [
    'environmental',
    'environment clearance',
    'pollution',
    'pollution control',
    'spcb',
    'cpcb',
    'eia',
    'air quality',
    'crz',
    'coastal zone'
  ],
  LAND_ACQUISITION: [
    'land',
    'land acquisition',
    'possession',
    'encroachment',
    'compensation',
    'rehabilitation',
    'resettlement',
    'r&r',
    'slao',
    'land owner',
    'mutation',
    'gazette',
    'section 3d',
    'section 3a',
    'row'
  ],
  LITIGATION: [
    'court',
    'stay order',
    'litigation',
    'high court',
    'supreme court',
    'tribunal',
    'ngt',
    'injunction',
    'lawsuit',
    'legal dispute',
    'arbitration'
  ],
  FUND_SHORTAGE: [
    'fund',
    'funds',
    'budget',
    'financial constraint',
    'payment delay',
    'grant',
    'allocation',
    'disbursement',
    'liquidity',
    'treasury',
    'cash flow'
  ],
  CONTRACTOR_ISSUE: [
    'contractor',
    'vendor',
    'agency',
    'labor',
    'manpower',
    'mobilization',
    'subcontractor',
    'equipment breakdown',
    'machinery',
    'contract termination',
    'contractor performance'
  ],
  UTILITY_SHIFTING: [
    'utility',
    'pipe',
    'pipeline',
    'electric pole',
    'transmission line',
    'gas pipeline',
    'water pipeline',
    'cables',
    'shifting'
  ],
  APPROVAL_DELAY: [
    'approval',
    'sanction',
    'nod',
    'clearance delay',
    'railway crossing',
    'rob',
    'inter-ministerial',
    'cabinet note',
    'standing finance committee'
  ],
  WEATHER: [
    'monsoon',
    'rain',
    'heavy rain',
    'flood',
    'cyclone',
    'winter',
    'snow',
    'landslide',
    'weather',
    'inundation'
  ]
};

/**
 * Rule-based NLP classifier matching delay text to standard MoSPI categories.
 * @param {string} text - Delay remarks or explanation text
 * @returns {Object} { category, confidence, matchedKeywords }
 */
export function classifyDelayRuleBased(text = '') {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return {
      category: 'NONE',
      confidence: 1.0,
      matchedKeywords: []
    };
  }

  const normalized = text.toLowerCase();
  const categoryScores = {};
  const categoryMatches = {};

  for (const [category, keywords] of Object.entries(KEYWORD_DICTIONARY)) {
    let count = 0;
    const matches = [];

    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        count += kw.length > 6 ? 2 : 1; // Give extra weight to specific multi-word phrases
        matches.push(kw);
      }
    }

    if (count > 0) {
      categoryScores[category] = count;
      categoryMatches[category] = matches;
    }
  }

  const detectedCategories = Object.keys(categoryScores);
  if (detectedCategories.length === 0) {
    return {
      category: 'OTHER',
      confidence: 0.5,
      matchedKeywords: []
    };
  }

  // Sort by highest weighted score
  detectedCategories.sort((a, b) => categoryScores[b] - categoryScores[a]);
  const bestCategory = detectedCategories[0];
  const score = categoryScores[bestCategory];
  const confidence = Math.min(0.98, 0.65 + score * 0.08);

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    matchedKeywords: categoryMatches[bestCategory] || []
  };
}

/**
 * Master delay classifier with remote ML microservice fallback.
 * @param {string} text
 * @returns {Promise<Object>}
 */
export async function classifyDelayReason(text = '') {
  const mlServiceUrl = process.env.ML_SERVICE_URL;

  if (mlServiceUrl && text && text.trim().length > 5) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${mlServiceUrl}/api/classify-delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const mlResult = await response.json();
        if (mlResult && mlResult.category) {
          return {
            category: mlResult.category,
            confidence: mlResult.confidence || 0.9,
            matchedKeywords: mlResult.matchedKeywords || [],
            source: 'PYTHON_ML_SERVICE'
          };
        }
      }
    } catch (err) {
      // Graceful fallback to rule-based classifier
      // console.warn('ML Service unreachable, falling back to rule-based delay classifier:', err.message);
    }
  }

  const result = classifyDelayRuleBased(text);
  return {
    ...result,
    source: 'RULE_BASED_NLP'
  };
}
