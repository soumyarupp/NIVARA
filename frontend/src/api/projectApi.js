/**
 * projectApi.js
 * -----------------------------------------------------------------------
 * Project Management & Submission Service Layer for NIVARA Platform.
 * Endpoints: GET /api/projects, GET /api/projects/:id, POST /api/projects, PUT /api/projects/:id, DELETE /api/projects/:id
 * -----------------------------------------------------------------------
 */

import apiClient, { isMockMode } from './apiClient';
import { mockProjectsList, filterMockProjects } from '../mock/projects';

const ProjectAPI = {

  STORAGE_KEY_DRAFT: "nivara_project_form_draft_v1",
  STORAGE_KEY_SUBMITTED: "nivara_submitted_projects_v1",

  getSectorsAndSubsectors() {
    return {
      "Railways": [
        "Dedicated Freight Corridors",
        "High-Speed & Semi-High Speed Rail",
        "Track Doubling & Electrification",
        "Station Redevelopment & Modernization",
        "Signaling, Telecomm & Kavach Deployments"
      ],
      "Roads & Highways": [
        "Access-Controlled National Expressways",
        "Economic & Logistic Corridors",
        "Strategic High-Altitude Tunnels",
        "Coastal & Border Highways",
        "Ring Roads & Bypass Infrastructure"
      ],
      "Urban Transit": [
        "Metro Rail Corridors (Underground/Elevated)",
        "Regional Rapid Transit System (RRTS)",
        "Light Metro / MetroLite",
        "Multi-Modal Urban Transit Hubs",
        "Bus Rapid Transit (BRTS)"
      ],
      "Power & Energy": [
        "Hydroelectric Mega Projects",
        "Ultra Mega Solar Power Parks",
        "High-Voltage Green Energy Corridors",
        "Offshore & Onshore Wind Energy",
        "Battery Energy Storage Systems (BESS)"
      ],
      "Ports & Shipping": [
        "Deep Sea Container Transshipment Ports",
        "Coastal Cargo & Bulk Berths",
        "National Inland Waterways Corridors",
        "Port Connectivity Roads & Rail Evacuation"
      ],
      "Petroleum & Natural Gas": [
        "Cross-Country Gas Transmission Pipelines",
        "Strategic Crude Oil Reserves (SPR)",
        "LNG Regasification Terminals",
        "City Gas Distribution (CGD) Networks"
      ],
      "Aviation & Aerospace": [
        "Greenfield International Airports",
        "Runway Expansion & New Terminal Buildings",
        "Integrated Air Cargo Hubs",
        "Heliports & Regional Connectivity (UDAN)"
      ],
      "Water & Irrigation": [
        "Inter-State River Linking Projects",
        "Multi-purpose Barrages & Dams",
        "Lift Irrigation & Canal Distribution",
        "National River Conservation Works"
      ]
    };
  },

  async getProjects(params = {}) {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      return filterMockProjects(params);
    }
    return apiClient.get('/api/projects', params);
  },

  async getProjectById(id) {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      const project = mockProjectsList.find(p => p.id === id);
      return { success: !!project, project: project || null };
    }
    return apiClient.get(`/api/projects/${id}`);
  },

  async createProject(formData) {
    if (isMockMode()) {
      return this.submitProject(formData);
    }
    return apiClient.post('/api/projects', formData);
  },

  async updateProject(id, formData) {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 400));
      return { success: true, message: `Project ${id} updated successfully.` };
    }
    return apiClient.put(`/api/projects/${id}`, formData);
  },

  async deleteProject(id) {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 300));
      return { success: true, message: `Project ${id} deleted.` };
    }
    return apiClient.delete(`/api/projects/${id}`);
  },

  async saveProjectDraft(formData) {
    await new Promise(resolve => setTimeout(resolve, 350));
    try {
      const payload = {
        data: formData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY_DRAFT, JSON.stringify(payload));
      return { success: true, timestamp: payload.savedAt };
    } catch (err) {
      console.warn("Unable to write draft to localStorage:", err);
      return { success: false, error: err.message };
    }
  },

  getProjectDraft() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_DRAFT);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.data || null;
    } catch (e) {
      return null;
    }
  },

  clearDraft() {
    try {
      localStorage.removeItem(this.STORAGE_KEY_DRAFT);
    } catch (e) { }
  },

  async submitProject(formData) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const year = new Date().getFullYear();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const projectId = `NIV-${year}-PRJ-${randomHex}`;
    const trackingNumber = `TRK-${Date.now().toString().slice(-8)}`;

    const submissionRecord = {
      projectId,
      trackingNumber,
      submittedAt: new Date().toISOString(),
      status: "Submitted / Awaiting Ministry Review",
      data: formData
    };

    try {
      const existingRaw = localStorage.getItem(this.STORAGE_KEY_SUBMITTED);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(submissionRecord);
      localStorage.setItem(this.STORAGE_KEY_SUBMITTED, JSON.stringify(existing.slice(0, 50)));
      this.clearDraft();
    } catch (err) {
      console.warn("Failed to store submission in localStorage:", err);
    }

    return {
      success: true,
      projectId,
      trackingNumber,
      submittedAt: submissionRecord.submittedAt
    };
  }
};

if (typeof window !== "undefined") {
  window.ProjectAPI = ProjectAPI;
}

export default ProjectAPI;
