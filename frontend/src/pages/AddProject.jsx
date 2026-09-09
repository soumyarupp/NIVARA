import React, { useEffect, useState } from 'react';
import './AddProject.css';
import './Dashboard.css';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';

const AddProject = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    /**
 * add-project.js
 * -------------------------------------------------------------------------------------
 * State Management, Validation, Dynamic Fields, and Submission for NIVARA Add Project Form
 * -------------------------------------------------------------------------------------
 */

// document.addEventListener("DOMContentLoaded", () => {
  let currentStep = 1;
  const totalSteps = 5;
  const visitedSteps = new Set([1]);

  // Dynamic state stores
  let additionalCostRows = [];
  let otherFundingRows = [];
  let customClearances = [];
  let tenderPackages = [];
  let uploadedFiles = [];

  // DOM Elements
  const stepNodes = document.querySelectorAll(".step-node");
  const stepCards = document.querySelectorAll(".form-step-card");
  const progressFill = document.getElementById("stepper-progress-fill");
  const btnPrev = document.getElementById("btn-prev-step");
  const btnNext = document.getElementById("btn-next-step");
  const btnSubmitFinal = document.getElementById("btn-submit-final");
  const btnSaveDraftTop = document.getElementById("btn-save-draft-top");
  const btnSaveDraftBottom = document.getElementById("btn-save-draft-bottom");
  const draftSavedIndicator = document.getElementById("draft-saved-text");
  const toastNotice = document.getElementById("toast-notice");
  const toastMessage = document.getElementById("toast-message");
  const successModal = document.getElementById("success-modal");

  // ================= 1. STEPPER NAVIGATION & PROGRESS =================
  function updateStepperUI() {
    // Update step fill line width: 0% -> 25% -> 50% -> 75% -> 100%
    const fillPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    if (progressFill) {
      progressFill.style.width = `calc(${fillPercent}% - ${fillPercent === 100 ? 0 : 20}px)`;
    }

    stepNodes.forEach(node => {
      const stepNum = parseInt(node.dataset.step, 10);
      const circle = node.querySelector(".step-circle");

      node.classList.remove("active", "completed");

      if (stepNum === currentStep) {
        node.classList.add("active");
        circle.innerHTML = stepNum;
      } else if (stepNum < currentStep) {
        node.classList.add("completed");
        // Checkmark icon for completed steps
        circle.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
      } else {
        circle.innerHTML = stepNum;
      }

      if (visitedSteps.has(stepNum)) {
        node.classList.add("visited");
      }
    });

    // Show current card
    stepCards.forEach(card => {
      card.classList.remove("active");
      if (parseInt(card.dataset.step, 10) === currentStep) {
        card.classList.add("active");
      }
    });

    // Update bottom action buttons
    if (btnPrev) {
      btnPrev.style.visibility = currentStep === 1 ? "hidden" : "visible";
    }

    if (currentStep === totalSteps) {
      if (btnNext) btnNext.style.display = "none";
      if (btnSubmitFinal) btnSubmitFinal.style.display = "inline-flex";
      renderReviewSummary();
    } else {
      if (btnNext) btnNext.style.display = "inline-flex";
      if (btnSubmitFinal) btnSubmitFinal.style.display = "none";
    }

    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function goToStep(step) {
    if (step < 1 || step > totalSteps) return;
    // Allow navigation only to visited steps or step 1
    if (!visitedSteps.has(step) && step > currentStep + 1) return;

    // Validate current step before advancing forward
    if (step > currentStep && !validateStep(currentStep)) {
      showToast("Please complete the required fields marked with * before continuing.");
      return;
    }

    currentStep = step;
    visitedSteps.add(currentStep);
    updateStepperUI();
    autoSaveDraft();
  }

  // Bind Stepper Clicks
  stepNodes.forEach(node => {
    node.addEventListener("click", () => {
      const step = parseInt(node.dataset.step, 10);
      if (visitedSteps.has(step) || step <= currentStep) {
        goToStep(step);
      }
    });
  });

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      goToStep(currentStep + 1);
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      goToStep(currentStep - 1);
    });
  }

  // ================= 2. STEP VALIDATION =================
  function validateStep(step) {
    let isValid = true;
    const card = document.querySelector(`.form-step-card[data-step="${step}"]`);
    if (!card) return true;

    // Find all required inputs within this active card
    const requiredInputs = card.querySelectorAll("input[required], select[required]");
    requiredInputs.forEach(input => {
      // Check if visible (ignore hidden conditional inputs)
      if (input.offsetParent === null) return;

      const fieldWrapper = input.closest(".form-field");
      if (!input.value.trim()) {
        isValid = false;
        if (fieldWrapper) fieldWrapper.classList.add("has-error");
      } else {
        if (fieldWrapper) fieldWrapper.classList.remove("has-error");
      }

      input.addEventListener("input", () => {
        if (fieldWrapper && input.value.trim()) {
          fieldWrapper.classList.remove("has-error");
        }
      });
    });

    return isValid;
  }

  // ================= 3. STEP 1: BASIC DETAILS & DEPENDENT DROPDOWN =================
  const sectorSelect = document.getElementById("p-sector");
  const subsectorSelect = document.getElementById("p-subsector");
  const sectorsMap = ProjectAPI.getSectorsAndSubsectors();

  function initSectorDropdowns() {
    if (!sectorSelect || !subsectorSelect) return;

    sectorSelect.innerHTML = '<option value="">Select Project Sector</option>' +
      Object.keys(sectorsMap).map(s => `<option value="${s}">${s}</option>`).join("");

    sectorSelect.addEventListener("change", () => {
      const selected = sectorSelect.value;
      if (selected && sectorsMap[selected]) {
        subsectorSelect.innerHTML = '<option value="">Select Specific Sub-Sector</option>' +
          sectorsMap[selected].map(sub => `<option value="${sub}">${sub}</option>`).join("");
        subsectorSelect.disabled = false;
      } else {
        subsectorSelect.innerHTML = '<option value="">Choose Sector first</option>';
        subsectorSelect.disabled = true;
      }
    });
  }
  initSectorDropdowns();

  // Radio cards click handlers
  document.querySelectorAll(".radio-cards-group").forEach(group => {
    group.querySelectorAll(".radio-card-label").forEach(label => {
      label.addEventListener("click", () => {
        group.querySelectorAll(".radio-card-label").forEach(l => l.classList.remove("selected"));
        label.classList.add("selected");
        const radio = label.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
      });
    });
  });

  // Calculate Scheduled Completion Date based on Start Date + Sanctioned Months
  const pStartDate = document.getElementById("p-start-date");
  const pDurationMonths = document.getElementById("p-duration-months");
  const pCompletionDate = document.getElementById("p-completion-date");

  function autoComputeCompletionDate() {
    if (!pStartDate?.value || !pDurationMonths?.value) return;
    const months = parseInt(pDurationMonths.value, 10);
    if (isNaN(months) || months <= 0) return;

    const start = new Date(pStartDate.value);
    if (isNaN(start.getTime())) return;

    start.setMonth(start.getMonth() + months);
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, "0");
    const dd = String(start.getDate()).padStart(2, "0");
    if (pCompletionDate && !pCompletionDate.value) {
      pCompletionDate.value = `${yyyy}-${mm}-${dd}`;
    }
  }

  if (pStartDate) pStartDate.addEventListener("change", autoComputeCompletionDate);
  if (pDurationMonths) pDurationMonths.addEventListener("input", autoComputeCompletionDate);

  // ================= 4. STEP 2: FINANCIALS & FUNDING RECONCILIATION =================
  const toggleLandCost = document.getElementById("toggle-land-cost");
  const boxLandCost = document.getElementById("box-land-cost");

  if (toggleLandCost && boxLandCost) {
    toggleLandCost.addEventListener("change", () => {
      boxLandCost.classList.toggle("active", toggleLandCost.checked);
    });
  }

  const toggleAdditionalCosts = document.getElementById("toggle-additional-costs");
  const boxAdditionalCosts = document.getElementById("box-additional-costs");
  const btnAddCostRow = document.getElementById("btn-add-cost-row");
  const costRowsContainer = document.getElementById("cost-rows-container");

  if (toggleAdditionalCosts && boxAdditionalCosts) {
    toggleAdditionalCosts.addEventListener("change", () => {
      boxAdditionalCosts.classList.toggle("active", toggleAdditionalCosts.checked);
    });
  }

  if (btnAddCostRow && costRowsContainer) {
    btnAddCostRow.addEventListener("click", () => {
      addCostRow();
    });
  }

  function addCostRow(desc = "", target = "", actual = "") {
    const rowId = "cost_row_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    const row = document.createElement("div");
    row.className = "dynamic-row";
    row.id = rowId;
    row.innerHTML = `
      <input type="text" class="form-input row-desc" placeholder="Component Description (e.g. Utility Shifting)" value="${desc}">
      <input type="number" class="form-input row-target" placeholder="Target (₹ Cr)" step="0.01" value="${target}">
      <input type="number" class="form-input row-actual" placeholder="Actual (₹ Cr)" step="0.01" value="${actual}">
      <button type="button" class="btn-remove-row" title="Remove Component">&times;</button>
    `;

    row.querySelector(".btn-remove-row").addEventListener("click", () => {
      row.remove();
      updateFundingSummary();
    });

    costRowsContainer.appendChild(row);
  }

  // Other Funding Source repeatable rows
  const btnAddPartner = document.getElementById("btn-add-partner-row");
  const partnerRowsContainer = document.getElementById("partner-rows-container");

  if (btnAddPartner && partnerRowsContainer) {
    btnAddPartner.addEventListener("click", () => {
      addPartnerRow();
    });
  }

  function addPartnerRow(name = "", amt = "") {
    const rowId = "partner_row_" + Date.now();
    const row = document.createElement("div");
    row.className = "dynamic-row";
    row.style.gridTemplateColumns = "2fr 1fr 40px";
    row.id = rowId;
    row.innerHTML = `
      <input type="text" class="form-input partner-name" placeholder="Co-Funding Partner / Agency" value="${name}">
      <input type="number" class="form-input partner-amt funding-amt-input" placeholder="Amount (₹ Cr)" step="0.01" value="${amt}">
      <button type="button" class="btn-remove-row" title="Remove Partner">&times;</button>
    `;

    row.querySelector(".btn-remove-row").addEventListener("click", () => {
      row.remove();
      updateFundingSummary();
    });

    row.querySelector(".partner-amt").addEventListener("input", updateFundingSummary);

    partnerRowsContainer.appendChild(row);
  }

  // Live Funding Summary & Validation
  const totalCostInput = document.getElementById("p-total-cost");
  const fundingInputs = document.querySelectorAll(".funding-amt-input");
  const statTotalCost = document.getElementById("stat-total-project-cost");
  const statTotalFunding = document.getElementById("stat-total-funding");
  const statVariance = document.getElementById("stat-funding-variance");
  const reconcileBadge = document.getElementById("reconcile-badge");
  const reconcileWarning = document.getElementById("reconcile-warning");

  function updateFundingSummary() {
    const totalCost = parseFloat(totalCostInput?.value || 0) || 0;

    let totalFunding = 0;
    document.querySelectorAll(".funding-amt-input").forEach(inp => {
      const val = parseFloat(inp.value || 0);
      if (!isNaN(val)) totalFunding += val;
    });

    const diff = totalFunding - totalCost;

    if (statTotalCost) statTotalCost.textContent = `₹ ${totalCost.toFixed(2)} Cr`;
    if (statTotalFunding) statTotalFunding.textContent = `₹ ${totalFunding.toFixed(2)} Cr`;

    if (statVariance) {
      if (Math.abs(diff) < 0.01) {
        statVariance.textContent = "₹ 0.00 Cr (Balanced)";
        statVariance.style.color = "#10b981";
      } else if (diff > 0) {
        statVariance.textContent = `+₹ ${diff.toFixed(2)} Cr (Surplus)`;
        statVariance.style.color = "#38bdf8";
      } else {
        statVariance.textContent = `-₹ ${Math.abs(diff).toFixed(2)} Cr (Deficit)`;
        statVariance.style.color = "#f87171";
      }
    }

    if (reconcileBadge && reconcileWarning) {
      if (totalCost > 0 && Math.abs(diff) < 0.01) {
        reconcileBadge.className = "reconcile-status-badge balanced";
        reconcileBadge.textContent = "Balanced 100%";
        reconcileWarning.classList.remove("show");
      } else if (totalCost > 0) {
        reconcileBadge.className = "reconcile-status-badge mismatch";
        reconcileBadge.textContent = diff < 0 ? "Funding Deficit" : "Funding Surplus";
        reconcileWarning.textContent = `Notice: Identified funding breakdown (₹ ${totalFunding.toFixed(2)} Cr) does not equal the Total Sanctioned Cost (₹ ${totalCost.toFixed(2)} Cr). Difference: ₹ ${Math.abs(diff).toFixed(2)} Cr.`;
        reconcileWarning.classList.add("show");
      } else {
        reconcileBadge.className = "reconcile-status-badge mismatch";
        reconcileBadge.textContent = "Awaiting Cost Entry";
        reconcileWarning.classList.remove("show");
      }
    }
  }

  if (totalCostInput) totalCostInput.addEventListener("input", updateFundingSummary);
  fundingInputs.forEach(inp => inp.addEventListener("input", updateFundingSummary));

  // ================= 5. STEP 3: MILESTONES, QUARTERLY & TENDERS =================
  const milestoneCards = document.querySelectorAll(".milestone-item-card");

  function evaluateMilestoneStatus(card) {
    const pEnd = card.querySelector(".m-planned-end")?.value;
    const aEnd = card.querySelector(".m-actual-end")?.value;
    const aStart = card.querySelector(".m-actual-start")?.value;
    const pill = card.querySelector(".milestone-status-pill");

    if (!pill) return;

    if (aEnd) {
      if (pEnd && new Date(aEnd) > new Date(pEnd)) {
        pill.className = "milestone-status-pill delayed";
        pill.textContent = "Completed (Delayed)";
      } else {
        pill.className = "milestone-status-pill completed";
        pill.textContent = "Completed (On Time)";
      }
    } else if (aStart) {
      if (pEnd && new Date() > new Date(pEnd)) {
        pill.className = "milestone-status-pill delayed";
        pill.textContent = "Delayed Slippage";
      } else {
        pill.className = "milestone-status-pill ontrack";
        pill.textContent = "In Progress";
      }
    } else {
      if (pEnd && new Date() > new Date(pEnd)) {
        pill.className = "milestone-status-pill delayed";
        pill.textContent = "Overdue Start";
      } else {
        pill.className = "milestone-status-pill ontrack";
        pill.textContent = "On Schedule";
      }
    }
  }

  milestoneCards.forEach(card => {
    card.querySelectorAll("input[type='date']").forEach(dateInp => {
      dateInp.addEventListener("change", () => evaluateMilestoneStatus(card));
    });
  });

  // Quarterly Table & Sparkline
  const quarterlyProgressInputs = document.querySelectorAll(".q-progress-pct");
  const sparklinePolyline = document.getElementById("sparkline-polyline");

  function updateSparkline() {
    if (!sparklinePolyline) return;
    const values = [];
    quarterlyProgressInputs.forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      values.push(Math.min(100, Math.max(0, val)));
    });

    // 4 points mapped to SVG 90 x 24
    const w = 90;
    const h = 24;
    const stepX = w / (values.length - 1 || 1);

    const points = values.map((v, i) => {
      const x = i * stepX;
      const y = h - (v / 100) * (h - 4) - 2;
      return `${x},${y}`;
    }).join(" ");

    sparklinePolyline.setAttribute("points", points);
  }

  quarterlyProgressInputs.forEach(inp => {
    inp.addEventListener("input", updateSparkline);
  });
  updateSparkline();

  // Expandable Tenders Sub-section
  const btnAddTender = document.getElementById("btn-add-tender");
  const tendersListContainer = document.getElementById("tenders-list-container");

  if (btnAddTender && tendersListContainer) {
    btnAddTender.addEventListener("click", () => {
      addTenderCard();
    });
  }

  function addTenderCard(tenderId = "", type = "EPC", link = "", date = "") {
    const cardId = "tender_" + Date.now();
    const card = document.createElement("div");
    card.className = "tender-package-card";
    card.id = cardId;
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <strong style="font-size: 13.5px; color: #0f172a;">Tender Package</strong>
        <button type="button" class="btn-remove-row" style="width: 28px; height: 28px;" title="Remove Tender">&times;</button>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label class="form-label">Tender Identification / NIT No.</label>
          <input type="text" class="form-input tender-nit" placeholder="e.g. NHAI/HQ/2026/PKG-04" value="${tenderId}">
        </div>
        <div class="form-field">
          <label class="form-label">Procurement Model</label>
          <select class="form-select tender-type">
            <option value="EPC" ${type === "EPC" ? "selected" : ""}>EPC Turnkey</option>
            <option value="HAM" ${type === "HAM" ? "selected" : ""}>Hybrid Annuity Model (HAM)</option>
            <option value="BOT" ${type === "BOT" ? "selected" : ""}>BOT (Toll/Annuity)</option>
            <option value="Consultancy" ${type === "Consultancy" ? "selected" : ""}>Consultancy & Supervision</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">e-Procurement Portal URL</label>
          <input type="url" class="form-input tender-link" placeholder="https://eprocure.gov.in/..." value="${link}">
        </div>
        <div class="form-field">
          <label class="form-label">Bid Submission Due Date</label>
          <input type="date" class="form-input tender-date" value="${date}">
        </div>
      </div>
    `;

    card.querySelector(".btn-remove-row").addEventListener("click", () => {
      card.remove();
    });

    tendersListContainer.appendChild(card);
  }

  // ================= 6. STEP 4: LOCATION & APPROVALS =================
  const toggleRow = document.getElementById("toggle-row-applicable");
  const boxRowAvail = document.getElementById("box-row-availability");

  if (toggleRow && boxRowAvail) {
    toggleRow.addEventListener("change", () => {
      boxRowAvail.classList.toggle("active", toggleRow.checked);
    });
  }

  // Clearances Status Toggles
  document.querySelectorAll(".clearance-item-row").forEach(item => {
    const buttons = item.querySelectorAll(".btn-clearance-status");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => {
          b.className = "btn-clearance-status";
        });
        const status = btn.dataset.status;
        btn.classList.add(`active-${status}`);

        // Toggle reference input if approved
        const refBox = item.querySelector(".clearance-ref-box");
        if (refBox) {
          refBox.style.display = status === "approved" ? "block" : "none";
        }
      });
    });
  });

  // Add Custom Clearance
  const btnAddClearance = document.getElementById("btn-add-clearance");
  const clearancesList = document.getElementById("clearances-checklist");

  if (btnAddClearance && clearancesList) {
    btnAddClearance.addEventListener("click", () => {
      const name = prompt("Enter Custom Statutory Clearance Name (e.g. Aviation Height NOC, Railway Over-Bridge GAD Approval):");
      if (name && name.trim()) {
        addCustomClearance(name.trim());
      }
    });
  }

  function addCustomClearance(name) {
    const row = document.createElement("div");
    row.className = "clearance-item-row";
    row.innerHTML = `
      <div>
        <span class="clearance-name">${name}</span>
      </div>
      <div class="clearance-status-toggle">
        <button type="button" class="btn-clearance-status active-approved" data-status="approved">Approved</button>
        <button type="button" class="btn-clearance-status" data-status="pending">Pending</button>
        <button type="button" class="btn-clearance-status" data-status="na">Not Required</button>
      </div>
    `;

    const buttons = row.querySelectorAll(".btn-clearance-status");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.className = "btn-clearance-status");
        btn.classList.add(`active-${btn.dataset.status}`);
      });
    });

    clearancesList.appendChild(row);
  }

  // File Upload Dropzone
  const dropzone = document.getElementById("file-dropzone");
  const fileInput = document.getElementById("p-file-input");
  const filesList = document.getElementById("uploaded-files-list");

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files) {
        handleFiles(fileInput.files);
      }
    });
  }

  function handleFiles(files) {
    Array.from(files).forEach(f => {
      uploadedFiles.push(f.name);
    });
    renderUploadedFilesList();
  }

  function renderUploadedFilesList() {
    if (!filesList) return;
    filesList.innerHTML = uploadedFiles.map((name, i) => `
      <div class="uploaded-file-chip">
        <span>📄 <strong>${name}</strong></span>
        <button type="button" style="background:none; border:none; color:#ef4444; cursor:pointer;" onclick="removeFile(${i})">&times;</button>
      </div>
    `).join("");
  }

  window.removeFile = function (index) {
    uploadedFiles.splice(index, 1);
    renderUploadedFilesList();
  };

  // ================= 7. STEP 5: REVIEW & SUBMIT =================
  const declarationCheck = document.getElementById("declaration-check");
  if (declarationCheck && btnSubmitFinal) {
    declarationCheck.addEventListener("change", () => {
      btnSubmitFinal.disabled = !declarationCheck.checked;
    });
  }

  function renderReviewSummary() {
    const data = collectFormData();

    // Section 1: Basic Details
    setText("rev-name", data.name || "—");
    setText("rev-sector", `${data.sector || "—"} / ${data.subsector || "—"}`);
    setText("rev-type", data.projectType || "—");
    setText("rev-classification", data.classification || "—");
    setText("rev-mode", data.implementationMode || "—");
    setText("rev-stage", data.stage || "—");
    setText("rev-start-date", data.startDate || "—");
    setText("rev-completion-date", data.completionDate || "—");

    // Section 2: Financials
    setText("rev-total-cost", data.totalCost ? `₹ ${data.totalCost} Cr` : "—");
    setText("rev-base-year", data.baseYear || "—");
    setText("rev-central-fund", data.centralFunding ? `₹ ${data.centralFunding} Cr` : "—");
    setText("rev-state-fund", data.stateFunding ? `₹ ${data.stateFunding} Cr` : "—");
    setText("rev-debt-fund", data.debtFunding ? `₹ ${data.debtFunding} Cr` : "—");
    setText("rev-private-fund", data.privateFunding ? `₹ ${data.privateFunding} Cr` : "—");

    // Section 3: Timeline & Location
    setText("rev-land-status", data.landStatus || "—");
    setText("rev-land-area", data.landArea ? `${data.landArea} ${data.landUnit}` : "—");
    setText("rev-row-avail", data.rowAvailable ? `${data.rowAvailable}% Available` : "N/A");
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Edit Shortcuts
  document.querySelectorAll(".btn-review-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetStep = parseInt(btn.dataset.targetStep, 10);
      if (targetStep) goToStep(targetStep);
    });
  });

  // ================= 8. DATA COLLECTION & DRAFT STORAGE =================
  function collectFormData() {
    return {
      // Step 1
      name: document.getElementById("p-name")?.value.trim() || "",
      sector: document.getElementById("p-sector")?.value || "",
      subsector: document.getElementById("p-subsector")?.value || "",
      projectType: document.getElementById("p-type")?.value || "",
      scheme: document.getElementById("p-scheme")?.value.trim() || "",
      classification: document.querySelector("input[name='classification']:checked")?.value || "Greenfield",
      implementationMode: document.querySelector("input[name='implementation_mode']:checked")?.value || "EPC",
      stage: document.getElementById("p-stage")?.value || "",
      approvalDate: document.getElementById("p-approval-date")?.value || "",
      durationMonths: document.getElementById("p-duration-months")?.value || "",
      startDate: document.getElementById("p-start-date")?.value || "",
      completionDate: document.getElementById("p-completion-date")?.value || "",
      locationsType: document.querySelector("input[name='locations_type']:checked")?.value || "Single",

      // Step 2
      totalCost: document.getElementById("p-total-cost")?.value || "",
      baseYear: document.getElementById("p-base-year")?.value || "",
      landCostIncluded: document.getElementById("toggle-land-cost")?.checked || false,
      landCost: document.getElementById("p-land-cost")?.value || "",
      centralFunding: document.getElementById("p-fund-central")?.value || "",
      stateFunding: document.getElementById("p-fund-state")?.value || "",
      debtFunding: document.getElementById("p-fund-debt")?.value || "",
      accrualsFunding: document.getElementById("p-fund-accruals")?.value || "",
      externalAidFunding: document.getElementById("p-fund-external")?.value || "",
      privateFunding: document.getElementById("p-fund-private")?.value || "",
      vgfFunding: document.getElementById("p-fund-vgf")?.value || "",

      // Step 4
      landStatus: document.querySelector("input[name='land_status']:checked")?.value || "Fully Acquired",
      landArea: document.getElementById("p-land-area")?.value || "",
      landUnit: document.getElementById("p-land-unit")?.value || "Acres",
      rowAvailable: document.getElementById("p-row-avail")?.value || "",
      description: document.getElementById("p-description")?.value.trim() || "",

      // Step 5 Contact
      contactName: document.getElementById("p-contact-name")?.value.trim() || "",
      contactDesignation: document.getElementById("p-contact-desig")?.value.trim() || "",
      contactEmail: document.getElementById("p-contact-email")?.value.trim() || "",
      contactPhone: document.getElementById("p-contact-phone")?.value.trim() || ""
    };
  }

  async function autoSaveDraft() {
    const data = collectFormData();
    if (!data.name && !data.sector && !data.totalCost) return;
    const res = await ProjectAPI.saveProjectDraft(data);
    if (res.success && draftSavedIndicator) {
      draftSavedIndicator.textContent = "Draft Auto-Saved";
    }
  }

  async function manualSaveDraft() {
    const data = collectFormData();
    const res = await ProjectAPI.saveProjectDraft(data);
    if (res.success) {
      showToast("Draft saved successfully! You can resume anytime.");
      if (draftSavedIndicator) {
        draftSavedIndicator.textContent = `Draft Saved (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      }
    } else {
      showToast("Could not save draft: " + (res.error || "storage issue"));
    }
  }

  if (btnSaveDraftTop) btnSaveDraftTop.addEventListener("click", manualSaveDraft);
  if (btnSaveDraftBottom) btnSaveDraftBottom.addEventListener("click", manualSaveDraft);

  // Restore Draft if exists
  function restoreDraft() {
    const draft = ProjectAPI.getProjectDraft();
    if (!draft) return;

    if (draft.name && document.getElementById("p-name")) document.getElementById("p-name").value = draft.name;
    if (draft.sector && sectorSelect) {
      sectorSelect.value = draft.sector;
      sectorSelect.dispatchEvent(new Event("change"));
      if (draft.subsector && subsectorSelect) subsectorSelect.value = draft.subsector;
    }
    if (draft.projectType && document.getElementById("p-type")) document.getElementById("p-type").value = draft.projectType;
    if (draft.scheme && document.getElementById("p-scheme")) document.getElementById("p-scheme").value = draft.scheme;
    if (draft.startDate && pStartDate) pStartDate.value = draft.startDate;
    if (draft.durationMonths && pDurationMonths) pDurationMonths.value = draft.durationMonths;
    if (draft.completionDate && pCompletionDate) pCompletionDate.value = draft.completionDate;

    if (draft.totalCost && totalCostInput) {
      totalCostInput.value = draft.totalCost;
    }
    if (draft.centralFunding && document.getElementById("p-fund-central")) document.getElementById("p-fund-central").value = draft.centralFunding;
    if (draft.stateFunding && document.getElementById("p-fund-state")) document.getElementById("p-fund-state").value = draft.stateFunding;
    if (draft.debtFunding && document.getElementById("p-fund-debt")) document.getElementById("p-fund-debt").value = draft.debtFunding;

    updateFundingSummary();
    if (draftSavedIndicator) draftSavedIndicator.textContent = "Draft Restored";
  }
  restoreDraft();

  // ================= 9. FINAL SUBMISSION =================
  if (btnSubmitFinal) {
    btnSubmitFinal.addEventListener("click", async () => {
      btnSubmitFinal.disabled = true;
      btnSubmitFinal.innerHTML = `
        <span>Submitting to NIVARA Intelligence Engine...</span>
      `;

      const data = collectFormData();
      try {
        const result = await ProjectAPI.submitProject(data);
        if (result.success) {
          // Show confirmation modal
          const displayId = document.getElementById("modal-display-project-id");
          const displayTrk = document.getElementById("modal-display-tracking-no");
          if (displayId) displayId.textContent = result.projectId;
          if (displayTrk) displayTrk.textContent = result.trackingNumber;

          if (successModal) {
            successModal.classList.add("active");
          }
        }
      } catch (err) {
        showToast("Submission failed: " + err.message);
        btnSubmitFinal.disabled = false;
        btnSubmitFinal.innerHTML = `<span>Submit for Review</span>`;
      }
    });
  }

  // Helper Toast
  function showToast(msg) {
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotice.classList.add("show");
    setTimeout(() => {
      toastNotice.classList.remove("show");
    }, 4000);
  }

  // Initial stepper render
  updateStepperUI();
// });

  }, []);

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Persistent Left Sidebar */}
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Main App Container */}
      <div className="admin-main-container">
        {/* Sticky Top Header */}
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/add-project"
        />

        {/* Scrollable Main Content */}
        <main className="admin-scrollable-content px-6 py-6 sm:px-10 sm:py-8">

    {/* Top Intro & Status Bar */}
    <div className="page-intro-header">
      <div className="intro-title-box">
        <h1>Add New Infrastructure Project</h1>
        <p>Unified intake system for implementing agencies, contractors, and ministerial nodal officers.</p>
      </div>
      <div className="draft-status-indicator" id="draft-saved-text">
        <span className="dot"></span> Draft Ready
      </div>
    </div>

    {/* ================= HORIZONTAL 5-STAGE PROGRESS STEPPER ================= */}
    <div className="stepper-container">
      <div className="stepper-track">
        {/* Connecting Progress Fill */}
        <div className="stepper-progress-fill" id="stepper-progress-fill" style={{width: '0%'}}></div>

        {/* Stage 1 */}
        <button type="button" className="step-node active" data-step="1">
          <div className="step-circle">1</div>
          <span className="step-label">Basic Details</span>
        </button>

        {/* Stage 2 */}
        <button type="button" className="step-node" data-step="2">
          <div className="step-circle">2</div>
          <span className="step-label">Financials &amp; Funding</span>
        </button>

        {/* Stage 3 */}
        <button type="button" className="step-node" data-step="3">
          <div className="step-circle">3</div>
          <span className="step-label">Timeline &amp; Milestones</span>
        </button>

        {/* Stage 4 */}
        <button type="button" className="step-node" data-step="4">
          <div className="step-circle">4</div>
          <span className="step-label">Location &amp; Approvals</span>
        </button>

        {/* Stage 5 */}
        <button type="button" className="step-node" data-step="5">
          <div className="step-circle">5</div>
          <span className="step-label">Review &amp; Submit</span>
        </button>
      </div>
    </div>

    {/* ================= STEP 1: BASIC DETAILS ================= */}
    <section className="form-step-card active" data-step="1">
      <div className="step-card-header">
        <h2>Stage 1: Core Project Identity &amp; Classification</h2>
        <p>Define the administrative baseline, sector classification, and implementation framework.</p>
      </div>

      <div className="form-grid">
        {/* Project Name */}
        <div className="form-field form-grid-full">
          <label htmlFor="p-name" className="form-label">Official Project Title <span className="req">*</span></label>
          <input type="text" id="p-name" className="form-input"
            placeholder="e.g. Construction of 6-Lane Access-Controlled Highway Corridor..." required />
          <span className="form-hint">Enter sanctioned project name as per the administrative approval order.</span>
          <span className="form-error-msg">Project title is mandatory.</span>
        </div>

        {/* Sector (Dependent) */}
        <div className="form-field">
          <label htmlFor="p-sector" className="form-label">Sector <span className="req">*</span></label>
          <select id="p-sector" className="form-select" required>
            {/* Populated dynamically by projectApi.js */}
          </select>
          <span className="form-error-msg">Please select an infrastructure sector.</span>
        </div>

        {/* Sub-Sector (Dependent) */}
        <div className="form-field">
          <label htmlFor="p-subsector" className="form-label">Sub-Sector Classification <span className="req">*</span></label>
          <select id="p-subsector" className="form-select" disabled required>
            <option value="">Choose Sector first</option>
          </select>
          <span className="form-error-msg">Please specify the sub-sector.</span>
        </div>

        {/* Project Type */}
        <div className="form-field">
          <label htmlFor="p-type" className="form-label">Project Type / Contract Model</label>
          <select id="p-type" className="form-select">
            <option value="EPC Turnkey">EPC Turnkey Contract</option>
            <option value="Hybrid Annuity Model (HAM)">Hybrid Annuity Model (HAM)</option>
            <option value="Design-Build-Finance-Operate (DBFOT)">DBFOT / Concessionaire</option>
            <option value="Item Rate / Balance Works">Item Rate Works Contract</option>
            <option value="Strategic Government Undertaking">Direct Departmental Execution</option>
          </select>
        </div>

        {/* National Scheme / Mission */}
        <div className="form-field">
          <label htmlFor="p-scheme" className="form-label">Associated Scheme / Flagship Mission (If any)</label>
          <input type="text" id="p-scheme" className="form-input"
            placeholder="e.g. PM Gati Shakti National Master Plan, Bharatmala Pariyojana, Sagarmala" />
        </div>

        {/* Project Classification (Greenfield / Brownfield) */}
        <div className="form-field">
          <label className="form-label">Project Classification <span className="req">*</span></label>
          <div className="radio-cards-group">
            <label className="radio-card-label selected">
              <input type="radio" name="classification" value="Greenfield" checked />
              <span className="radio-card-title">Greenfield</span>
              <span className="radio-card-desc">New corridor / site</span>
            </label>
            <label className="radio-card-label">
              <input type="radio" name="classification" value="Brownfield" />
              <span className="radio-card-title">Brownfield</span>
              <span className="radio-card-desc">Expansion / Upgradation</span>
            </label>
          </div>
        </div>

        {/* Implementation Mode */}
        <div className="form-field">
          <label className="form-label">Implementation Mode <span className="req">*</span></label>
          <div className="radio-cards-group">
            <label className="radio-card-label selected">
              <input type="radio" name="implementation_mode" value="EPC" checked />
              <span className="radio-card-title">EPC</span>
              <span className="radio-card-desc">Public Funding</span>
            </label>
            <label className="radio-card-label">
              <input type="radio" name="implementation_mode" value="PPP" />
              <span className="radio-card-title">PPP</span>
              <span className="radio-card-desc">Public-Private</span>
            </label>
            <label className="radio-card-label">
              <input type="radio" name="implementation_mode" value="Private" />
              <span className="radio-card-title">Private</span>
              <span className="radio-card-desc">Commercial</span>
            </label>
            <label className="radio-card-label">
              <input type="radio" name="implementation_mode" value="To be finalized" />
              <span className="radio-card-title">TBD</span>
              <span className="radio-card-desc">Under Bidding</span>
            </label>
          </div>
        </div>

        {/* Current Project Stage */}
        <div className="form-field">
          <label htmlFor="p-stage" className="form-label">Current Lifecycle Stage <span className="req">*</span></label>
          <select id="p-stage" className="form-select" required>
            <option value="Conceptualization & DPR">Conceptualization &amp; Detailed Project Report (DPR)</option>
            <option value="Under Development / Tendering">Under Development &amp; Tendering</option>
            <option value="Under Implementation" selected>Under Implementation / Construction</option>
            <option value="Completed & Commissioned">Completed &amp; Commissioned</option>
          </select>
        </div>

        {/* Number of Locations */}
        <div className="form-field">
          <label className="form-label">Geographic Footprint</label>
          <div className="radio-cards-group">
            <label className="radio-card-label selected">
              <input type="radio" name="locations_type" value="Single Location" checked />
              <span className="radio-card-title">Single Site</span>
              <span className="radio-card-desc">Stationary Plant/Hub</span>
            </label>
            <label className="radio-card-label">
              <input type="radio" name="locations_type" value="Multiple Linear" />
              <span className="radio-card-title">Linear Corridor</span>
              <span className="radio-card-desc">Cross-District Stretch</span>
            </label>
            <label className="radio-card-label">
              <input type="radio" name="locations_type" value="Offshore / Coastal" />
              <span className="radio-card-title">Offshore</span>
              <span className="radio-card-desc">Marine / Island</span>
            </label>
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="form-field">
          <label htmlFor="p-approval-date" className="form-label">Administrative Sanction Date <span
              className="req">*</span></label>
          <input type="date" id="p-approval-date" className="form-input" required />
        </div>

        <div className="form-field">
          <label htmlFor="p-duration-months" className="form-label">Sanctioned Duration (Months) <span
              className="req">*</span></label>
          <input type="number" id="p-duration-months" className="form-input" placeholder="e.g. 36" min="1" max="240"
            required />
        </div>

        <div className="form-field">
          <label htmlFor="p-start-date" className="form-label">Project Start Date / Appointed Date <span
              className="req">*</span></label>
          <input type="date" id="p-start-date" className="form-input" required />
        </div>

        <div className="form-field">
          <label htmlFor="p-completion-date" className="form-label">Scheduled Completion Date <span className="req">*</span></label>
          <input type="date" id="p-completion-date" className="form-input" required />
          <span className="form-hint">Auto-computed from start date + sanctioned duration.</span>
        </div>
      </div>
    </section>

    {/* ================= STEP 2: FINANCIALS & FUNDING ================= */}
    <section className="form-step-card" data-step="2">
      <div className="step-card-header">
        <h2>Stage 2: Outlay &amp; Funding Architecture</h2>
        <p>Specify sanctioned capital expenditure and map contributions across central, state, and debt facilities.</p>
      </div>

      <div className="form-grid">
        {/* Total Sanctioned Cost */}
        <div className="form-field">
          <label htmlFor="p-total-cost" className="form-label">Total Sanctioned Project Outlay (₹ Crore) <span
              className="req">*</span></label>
          <input type="number" id="p-total-cost" className="form-input" placeholder="e.g. 12450.00" step="0.01" min="0"
            required />
          <span className="form-hint">Approved capital expenditure in INR Crores.</span>
          <span className="form-error-msg">Total project cost is required.</span>
        </div>

        {/* Base Financial Year */}
        <div className="form-field">
          <label htmlFor="p-base-year" className="form-label">Base Financial Year of Estimate <span className="req">*</span></label>
          <select id="p-base-year" className="form-select" required>
            <option value="2026-27" selected>FY 2026-27 (Current)</option>
            <option value="2025-26">FY 2025-26</option>
            <option value="2024-25">FY 2024-25</option>
            <option value="2023-24">FY 2023-24</option>
            <option value="2022-23">FY 2022-23</option>
          </select>
        </div>
      </div>

      {/* Toggle: Land Cost Included? */}
      <div style={{marginTop: '20px'}}>
        <div className="toggle-wrapper">
          <div className="toggle-info">
            <span className="toggle-title">Does Total Cost include Land Acquisition Outlay?</span>
            <span className="toggle-desc">Toggle on if compensation and land rehabilitation costs are factored into the
              sanctioned estimate.</span>
          </div>
          <label className="switch">
            <input type="checkbox" id="toggle-land-cost" />
            <span className="slider"></span>
          </label>
        </div>

        <div className="conditional-field-box" id="box-land-cost">
          <div className="form-field" style={{maxWidth: '400px'}}>
            <label htmlFor="p-land-cost" className="form-label">Component for Land Acquisition (₹ Crore)</label>
            <input type="number" id="p-land-cost" className="form-input" placeholder="e.g. 1850.00" step="0.01" />
          </div>
        </div>
      </div>

      {/* Toggle: Additional Cost Components? */}
      <div style={{marginTop: '16px'}}>
        <div className="toggle-wrapper">
          <div className="toggle-info">
            <span className="toggle-title">Any Additional Cost Breakdown Components?</span>
            <span className="toggle-desc">Itemize special allocations such as utility shifting, environmental mitigation, or
              consultancy fees.</span>
          </div>
          <label className="switch">
            <input type="checkbox" id="toggle-additional-costs" />
            <span className="slider"></span>
          </label>
        </div>

        <div className="conditional-field-box" id="box-additional-costs">
          <div className="dynamic-rows-container" id="cost-rows-container">
            {/* Dynamic rows injected here */}
          </div>
          <button type="button" className="btn-add-row" id="btn-add-cost-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Additional Cost Component
          </button>
        </div>
      </div>

      {/* Funding Source Breakdown Grouped Cards */}
      <div style={{marginTop: '30px'}}>
        <h3 style={{fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px'}}>Funding Source Breakdown</h3>
        <p style={{fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px'}}>Specify exact financial
          allocations (₹ Cr). Values auto-reconcile in real time.</p>

        <div className="funding-source-cards-grid">
          {/* Central Support */}
          <div className="funding-card">
            <div className="funding-card-header">
              <span>Central Government Budgetary Support</span>
              <span style={{fontSize: '11px', color: '#0284c7', fontWeight: '700'}}>Grant / Equity</span>
            </div>
            <input type="number" id="p-fund-central" className="form-input funding-amt-input" placeholder="Amount (₹ Cr)"
              step="0.01" />
          </div>

          {/* State Support */}
          <div className="funding-card">
            <div className="funding-card-header">
              <span>State Government Contribution</span>
              <span style={{fontSize: '11px', color: '#0d9488', fontWeight: '700'}}>State Share</span>
            </div>
            <input type="number" id="p-fund-state" className="form-input funding-amt-input" placeholder="Amount (₹ Cr)"
              step="0.01" />
          </div>

          {/* Debt / Loans */}
          <div className="funding-card">
            <div className="funding-card-header">
              <span>Debt / Borrowings / Commercial Loans</span>
              <span style={{fontSize: '11px', color: '#6b4ee6', fontWeight: '700'}}>PFC / REC / Banks</span>
            </div>
            <input type="number" id="p-fund-debt" className="form-input funding-amt-input" placeholder="Amount (₹ Cr)"
              step="0.01" />
          </div>

          {/* Internal Accruals */}
          <div className="funding-card">
            <div className="funding-card-header">
              <span>Internal Accruals / PSU Reserves</span>
              <span style={{fontSize: '11px', color: '#334155', fontWeight: '700'}}>Agency Funds</span>
            </div>
            <input type="number" id="p-fund-accruals" className="form-input funding-amt-input" placeholder="Amount (₹ Cr)"
              step="0.01" />
          </div>

          {/* External Aid */}
          <div className="funding-card">
            <div className="funding-card-header">
              <span>External Multilateral / Bilateral Aid</span>
              <span style={{fontSize: '11px', color: '#f59e0b', fontWeight: '700'}}>WB / ADB / JICA</span>
            </div>
            <input type="number" id="p-fund-external" className="form-input funding-amt-input" placeholder="Amount (₹ Cr)"
              step="0.01" />
          </div>

          {/* Private Equity / PPP */}
          <div className="funding-card">
            <div className="funding-card-header">
              <span>Private Equity / Concessionaire Share</span>
              <span style={{fontSize: '11px', color: '#0f766e', fontWeight: '700'}}>PPP Investor</span>
            </div>
            <input type="number" id="p-fund-private" className="form-input funding-amt-input" placeholder="Amount (₹ Cr)"
              step="0.01" />
          </div>

          {/* VGF */}
          <div className="funding-card" style={{gridColumn: 'span 2'}}>
            <div className="funding-card-header">
              <span>Viability Gap Funding (VGF)</span>
              <span style={{fontSize: '11px', color: '#be123c', fontWeight: '700'}}>DEA Scheme</span>
            </div>
            <input type="number" id="p-fund-vgf" className="form-input funding-amt-input" placeholder="Amount (₹ Cr)"
              step="0.01" />
          </div>
        </div>

        {/* Dynamic Other Funding Partners */}
        <div style={{marginTop: '14px'}}>
          <div className="dynamic-rows-container" id="partner-rows-container">
            {/* Dynamic partner rows injected here */}
          </div>
          <button type="button" className="btn-add-row" id="btn-add-partner-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Other Co-Funding Partner
          </button>
        </div>
      </div>

      {/* Live Reconciliation Summary Box */}
      <div className="funding-reconciliation-card">
        <div className="reconcile-header">
          <span className="reconcile-title">Financial Reconciliation &amp; Parity Check</span>
          <span className="reconcile-status-badge mismatch" id="reconcile-badge">Checking...</span>
        </div>

        <div className="reconcile-stats-row">
          <div className="reconcile-stat-box">
            <h4>Total Sanctioned Outlay</h4>
            <p id="stat-total-project-cost">₹ 0.00 Cr</p>
          </div>
          <div className="reconcile-stat-box">
            <h4>Identified Funding Breakdown</h4>
            <p id="stat-total-funding">₹ 0.00 Cr</p>
          </div>
          <div className="reconcile-stat-box">
            <h4>Net Funding Balance</h4>
            <p id="stat-funding-variance">₹ 0.00 Cr</p>
          </div>
        </div>

        <div className="reconcile-warning-banner" id="reconcile-warning">
          Funding breakdown does not match the Total Sanctioned Cost.
        </div>
      </div>
    </section>

    {/* ================= STEP 3: TIMELINE & MILESTONES ================= */}
    <section className="form-step-card" data-step="3">
      <div className="step-card-header">
        <h2>Stage 3: Key Milestone Tracking &amp; Progress Scheduling</h2>
        <p>Set baseline target dates and track milestone completion slippage computed automatically by NIVARA.</p>
      </div>

      {/* Milestone Tracker Cards List */}
      <div className="milestones-list-container">

        {/* Milestone 1: Planning */}
        <div className="milestone-item-card">
          <div className="milestone-card-top">
            <div className="milestone-index-badge">
              <span className="milestone-index-num">1</span>
              <span>Planning, Feasibility &amp; DPR Finalization</span>
            </div>
            <span className="milestone-status-pill ontrack">On Schedule</span>
          </div>
          <div className="milestone-dates-grid">
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned Start</label>
              <input type="date" className="form-input m-planned-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned End</label>
              <input type="date" className="form-input m-planned-end" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised Start</label>
              <input type="date" className="form-input m-actual-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised End</label>
              <input type="date" className="form-input m-actual-end" />
            </div>
          </div>
        </div>

        {/* Milestone 2: Land Acquisition */}
        <div className="milestone-item-card">
          <div className="milestone-card-top">
            <div className="milestone-index-badge">
              <span className="milestone-index-num">2</span>
              <span>Land Acquisition &amp; Right of Way (RoW) Handover</span>
            </div>
            <span className="milestone-status-pill ontrack">On Schedule</span>
          </div>
          <div className="milestone-dates-grid">
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned Start</label>
              <input type="date" className="form-input m-planned-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned End</label>
              <input type="date" className="form-input m-planned-end" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised Start</label>
              <input type="date" className="form-input m-actual-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised End</label>
              <input type="date" className="form-input m-actual-end" />
            </div>
          </div>
        </div>

        {/* Milestone 3: Statutory Clearances */}
        <div className="milestone-item-card">
          <div className="milestone-card-top">
            <div className="milestone-index-badge">
              <span className="milestone-index-num">3</span>
              <span>Statutory Clearances (Environment, Forest, Railways, Defense)</span>
            </div>
            <span className="milestone-status-pill ontrack">On Schedule</span>
          </div>
          <div className="milestone-dates-grid">
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned Start</label>
              <input type="date" className="form-input m-planned-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned End</label>
              <input type="date" className="form-input m-planned-end" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised Start</label>
              <input type="date" className="form-input m-actual-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised End</label>
              <input type="date" className="form-input m-actual-end" />
            </div>
          </div>
        </div>

        {/* Milestone 4: Tender Publishing */}
        <div className="milestone-item-card">
          <div className="milestone-card-top">
            <div className="milestone-index-badge">
              <span className="milestone-index-num">4</span>
              <span>Tender Notice Inviting Tender (NIT) Publishing</span>
            </div>
            <span className="milestone-status-pill ontrack">On Schedule</span>
          </div>
          <div className="milestone-dates-grid">
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned Start</label>
              <input type="date" className="form-input m-planned-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned End</label>
              <input type="date" className="form-input m-planned-end" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised Start</label>
              <input type="date" className="form-input m-actual-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised End</label>
              <input type="date" className="form-input m-actual-end" />
            </div>
          </div>
        </div>

        {/* Milestone 5: Tender Award */}
        <div className="milestone-item-card">
          <div className="milestone-card-top">
            <div className="milestone-index-badge">
              <span className="milestone-index-num">5</span>
              <span>Letter of Award (LoA) &amp; Contractor Mobilization</span>
            </div>
            <span className="milestone-status-pill ontrack">On Schedule</span>
          </div>
          <div className="milestone-dates-grid">
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned Start</label>
              <input type="date" className="form-input m-planned-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned End</label>
              <input type="date" className="form-input m-planned-end" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised Start</label>
              <input type="date" className="form-input m-actual-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised End</label>
              <input type="date" className="form-input m-actual-end" />
            </div>
          </div>
        </div>

        {/* Milestone 6: Civil Construction */}
        <div className="milestone-item-card">
          <div className="milestone-card-top">
            <div className="milestone-index-badge">
              <span className="milestone-index-num">6</span>
              <span>Major Civil Construction &amp; Structural Execution</span>
            </div>
            <span className="milestone-status-pill ontrack">On Schedule</span>
          </div>
          <div className="milestone-dates-grid">
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned Start</label>
              <input type="date" className="form-input m-planned-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned End</label>
              <input type="date" className="form-input m-planned-end" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised Start</label>
              <input type="date" className="form-input m-actual-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised End</label>
              <input type="date" className="form-input m-actual-end" />
            </div>
          </div>
        </div>

        {/* Milestone 7: Final Commissioning */}
        <div className="milestone-item-card">
          <div className="milestone-card-top">
            <div className="milestone-index-badge">
              <span className="milestone-index-num">7</span>
              <span>Trial Testing, Safety Certification &amp; Commercial Commissioning</span>
            </div>
            <span className="milestone-status-pill ontrack">On Schedule</span>
          </div>
          <div className="milestone-dates-grid">
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned Start</label>
              <input type="date" className="form-input m-planned-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Planned End</label>
              <input type="date" className="form-input m-planned-end" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised Start</label>
              <input type="date" className="form-input m-actual-start" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{fontSize: '11.5px'}}>Actual/Revised End</label>
              <input type="date" className="form-input m-actual-end" />
            </div>
          </div>
        </div>

      </div>

      {/* Quarterly Progress Section with SVG Sparkline */}
      <div className="quarterly-section">
        <div className="quarterly-header-row">
          <div>
            <h3 style={{fontSize: '16px', fontWeight: '800', color: '#0f172a'}}>Quarterly Progress Influx</h3>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>Record physical cumulative completion (%) and
              financial disbursement (₹ Cr).</p>
          </div>
          <div className="sparkline-box">
            <span style={{fontSize: '11.5px', fontWeight: '700', color: '#64748b'}}>Trajectory Sparkline:</span>
            <svg className="sparkline-svg" viewBox="0 0 90 24">
              <polyline id="sparkline-polyline" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round" points="0,20 30,16 60,10 90,4" />
            </svg>
          </div>
        </div>

        <table className="quarterly-table">
          <thead>
            <tr>
              <th>Quarter Interval</th>
              <th>Cumulative Physical Progress (%)</th>
              <th>Cumulative Financial Outlay (₹ Cr)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Q1 (Apr – Jun 2026)</strong></td>
              <td><input type="number" className="form-input q-progress-pct" placeholder="e.g. 15" min="0" max="100"
                  value="15" /></td>
              <td><input type="number" className="form-input" placeholder="Disbursed (₹ Cr)" step="0.01" value="1250.00" />
              </td>
            </tr>
            <tr>
              <td><strong>Q2 (Jul – Sep 2026)</strong></td>
              <td><input type="number" className="form-input q-progress-pct" placeholder="e.g. 28" min="0" max="100"
                  value="28" /></td>
              <td><input type="number" className="form-input" placeholder="Disbursed (₹ Cr)" step="0.01" value="2840.00" />
              </td>
            </tr>
            <tr>
              <td><strong>Q3 (Oct – Dec 2026)</strong></td>
              <td><input type="number" className="form-input q-progress-pct" placeholder="e.g. 42" min="0" max="100"
                  value="45" /></td>
              <td><input type="number" className="form-input" placeholder="Disbursed (₹ Cr)" step="0.01" value="4600.00" />
              </td>
            </tr>
            <tr>
              <td><strong>Q4 (Jan – Mar 2027)</strong></td>
              <td><input type="number" className="form-input q-progress-pct" placeholder="e.g. 60" min="0" max="100"
                  value="62" /></td>
              <td><input type="number" className="form-input" placeholder="Disbursed (₹ Cr)" step="0.01" value="6900.00" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expandable Tenders Sub-section */}
      <div className="tenders-section">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h3 style={{fontSize: '16px', fontWeight: '800', color: '#0f172a'}}>Tender Packages &amp; Procurement Notices
            </h3>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>Attach NIT numbers, e-procurement links, and
              submission dates.</p>
          </div>
          <button type="button" className="btn-add-row" id="btn-add-tender">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Tender Package
          </button>
        </div>

        <div id="tenders-list-container">
          {/* Dynamically added tender packages */}
        </div>
      </div>
    </section>

    {/* ================= STEP 4: LOCATION & APPROVALS ================= */}
    <section className="form-step-card" data-step="4">
      <div className="step-card-header">
        <h2>Stage 4: Land Footprint &amp; Statutory Clearances</h2>
        <p>Document land acquisition parcels, right-of-way availability, and mandatory clearance certifications.</p>
      </div>

      {/* Land Acquisition Status */}
      <div className="form-field">
        <label className="form-label">Land Acquisition Status <span className="req">*</span></label>
        <div className="radio-cards-group">
          <label className="radio-card-label selected">
            <input type="radio" name="land_status" value="Fully Acquired" checked />
            <span className="radio-card-title">100% Acquired</span>
            <span className="radio-card-desc">Clear possession in hand</span>
          </label>
          <label className="radio-card-label">
            <input type="radio" name="land_status" value="Partially Acquired" />
            <span className="radio-card-title">Partially Acquired</span>
            <span className="radio-card-desc">Section 11/19 in progress</span>
          </label>
          <label className="radio-card-label">
            <input type="radio" name="land_status" value="Not Applicable" />
            <span className="radio-card-title">Not Applicable</span>
            <span className="radio-card-desc">Existing govt right-of-way</span>
          </label>
        </div>
      </div>

      <div className="form-grid" style={{marginTop: '20px'}}>
        <div className="form-field">
          <label htmlFor="p-land-area" className="form-label">Total Land Area Required</label>
          <input type="number" id="p-land-area" className="form-input" placeholder="e.g. 450.50" step="0.01" />
        </div>

        <div className="form-field">
          <label htmlFor="p-land-unit" className="form-label">Area Measurement Unit</label>
          <select id="p-land-unit" className="form-select">
            <option value="Acres" selected>Acres</option>
            <option value="Hectares">Hectares</option>
            <option value="Square Meters">Square Meters</option>
            <option value="Kilometers (Linear Strip)">Kilometers (Linear Strip)</option>
          </select>
        </div>
      </div>

      {/* Right of Way Toggle */}
      <div style={{marginTop: '20px'}}>
        <div className="toggle-wrapper">
          <div className="toggle-info">
            <span className="toggle-title">Is Right of Way (RoW) Clearance Applicable?</span>
            <span className="toggle-desc">Applicable for linear projects such as highways, pipelines, rail corridors, and
              transmission grids.</span>
          </div>
          <label className="switch">
            <input type="checkbox" id="toggle-row-applicable" />
            <span className="slider"></span>
          </label>
        </div>

        <div className="conditional-field-box" id="box-row-availability">
          <div className="form-field" style={{maxWidth: '400px'}}>
            <label htmlFor="p-row-avail" className="form-label">Percentage of RoW Handed Over to Contractor (%)</label>
            <input type="number" id="p-row-avail" className="form-input" placeholder="e.g. 85" min="0" max="100" />
          </div>
        </div>
      </div>

      {/* Statutory Clearances Checklist */}
      <div style={{marginTop: '32px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
          <div>
            <h3 style={{fontSize: '16px', fontWeight: '800', color: '#0f172a'}}>Statutory Clearances Checklist</h3>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>Record approvals status across key
              environmental, coastal, and security regulators.</p>
          </div>
          <button type="button" className="btn-add-row" id="btn-add-clearance">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Custom Clearance
          </button>
        </div>

        <div className="clearances-checklist" id="clearances-checklist">
          {/* Environmental Clearance */}
          <div className="clearance-item-row">
            <div>
              <span className="clearance-name">Environmental Clearance (MoEFCC / SEIAA)</span>
            </div>
            <div className="clearance-status-toggle">
              <button type="button" className="btn-clearance-status active-approved"
                data-status="approved">Approved</button>
              <button type="button" className="btn-clearance-status" data-status="pending">Pending</button>
              <button type="button" className="btn-clearance-status" data-status="na">Not Required</button>
            </div>
          </div>

          {/* Forest Clearance */}
          <div className="clearance-item-row">
            <div>
              <span className="clearance-name">Forest Diversion Clearance (Stage-I / Stage-II)</span>
            </div>
            <div className="clearance-status-toggle">
              <button type="button" className="btn-clearance-status" data-status="approved">Approved</button>
              <button type="button" className="btn-clearance-status active-pending" data-status="pending">Pending</button>
              <button type="button" className="btn-clearance-status" data-status="na">Not Required</button>
            </div>
          </div>

          {/* Defence Clearance */}
          <div className="clearance-item-row">
            <div>
              <span className="clearance-name">Defence / Border Roads Security NOC</span>
            </div>
            <div className="clearance-status-toggle">
              <button type="button" className="btn-clearance-status" data-status="approved">Approved</button>
              <button type="button" className="btn-clearance-status" data-status="pending">Pending</button>
              <button type="button" className="btn-clearance-status active-na" data-status="na">Not Required</button>
            </div>
          </div>

          {/* Coastal Regulation Zone */}
          <div className="clearance-item-row">
            <div>
              <span className="clearance-name">Coastal Regulation Zone (CRZ) Clearance</span>
            </div>
            <div className="clearance-status-toggle">
              <button type="button" className="btn-clearance-status" data-status="approved">Approved</button>
              <button type="button" className="btn-clearance-status" data-status="pending">Pending</button>
              <button type="button" className="btn-clearance-status active-na" data-status="na">Not Required</button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Description Textarea */}
      <div className="form-field" style={{marginTop: '30px'}}>
        <label htmlFor="p-description" className="form-label">Project Scope Summary &amp; Key Objectives</label>
        <textarea id="p-description" className="form-textarea"
          placeholder="Provide a concise engineering overview of the corridor alignment, civil structures, planned bridges/tunnels, and socio-economic impact..."></textarea>
      </div>

      {/* File Upload Zone */}
      <div className="form-field" style={{marginTop: '24px'}}>
        <label className="form-label">Supporting Documents, Alignment Map, or DPR Extracts</label>
        <div className="file-dropzone-card" id="file-dropzone">
          <input type="file" id="p-file-input" multiple accept=".pdf,.kmz,.kml,.geojson,.dwg,.xlsx,.docx" />
          <div className="dropzone-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="dropzone-title">Click to browse or drag and drop files here</div>
          <div className="dropzone-subtitle">Supported formats: PDF, GeoJSON, KML, CAD (DWG), Excel. Maximum file size: 25
            MB per document.</div>
        </div>
        <div className="uploaded-files-list" id="uploaded-files-list">
          {/* Files list */}
        </div>
      </div>
    </section>

    {/* ================= STEP 5: REVIEW & SUBMIT ================= */}
    <section className="form-step-card" data-step="5">
      <div className="step-card-header">
        <h2>Stage 5: Final Review &amp; Official Submission</h2>
        <p>Verify project data integrity before dispatching to the NIVARA predictive risk telemetry engine.</p>
      </div>

      <div className="review-sections-wrap">

        {/* Review Section 1 */}
        <div className="review-box">
          <div className="review-box-header">
            <span className="review-box-title">1. Basic Project Identity</span>
            <button type="button" className="btn-review-edit" data-target-step="1">Edit Section</button>
          </div>
          <div className="review-data-grid">
            <div className="review-item">
              <h5>Project Name</h5>
              <p id="rev-name">—</p>
            </div>
            <div className="review-item">
              <h5>Sector / Sub-Sector</h5>
              <p id="rev-sector">—</p>
            </div>
            <div className="review-item">
              <h5>Contract Type</h5>
              <p id="rev-type">—</p>
            </div>
            <div className="review-item">
              <h5>Classification</h5>
              <p id="rev-classification">—</p>
            </div>
            <div className="review-item">
              <h5>Execution Mode</h5>
              <p id="rev-mode">—</p>
            </div>
            <div className="review-item">
              <h5>Lifecycle Stage</h5>
              <p id="rev-stage">—</p>
            </div>
            <div className="review-item">
              <h5>Start Date</h5>
              <p id="rev-start-date">—</p>
            </div>
            <div className="review-item">
              <h5>Scheduled Completion</h5>
              <p id="rev-completion-date">—</p>
            </div>
          </div>
        </div>

        {/* Review Section 2 */}
        <div className="review-box">
          <div className="review-box-header">
            <span className="review-box-title">2. Financial Outlay &amp; Funding Allocation</span>
            <button type="button" className="btn-review-edit" data-target-step="2">Edit Section</button>
          </div>
          <div className="review-data-grid">
            <div className="review-item">
              <h5>Sanctioned Outlay</h5>
              <p id="rev-total-cost" style={{color: '#0284c7'}}>—</p>
            </div>
            <div className="review-item">
              <h5>Base Year</h5>
              <p id="rev-base-year">—</p>
            </div>
            <div className="review-item">
              <h5>Central Support</h5>
              <p id="rev-central-fund">—</p>
            </div>
            <div className="review-item">
              <h5>State Share</h5>
              <p id="rev-state-fund">—</p>
            </div>
            <div className="review-item">
              <h5>Debt / Loans</h5>
              <p id="rev-debt-fund">—</p>
            </div>
            <div className="review-item">
              <h5>Private Equity</h5>
              <p id="rev-private-fund">—</p>
            </div>
          </div>
        </div>

        {/* Review Section 3 */}
        <div className="review-box">
          <div className="review-box-header">
            <span className="review-box-title">3. Land, Clearances &amp; Location</span>
            <button type="button" className="btn-review-edit" data-target-step="4">Edit Section</button>
          </div>
          <div className="review-data-grid">
            <div className="review-item">
              <h5>Land Possession</h5>
              <p id="rev-land-status">—</p>
            </div>
            <div className="review-item">
              <h5>Total Land Area</h5>
              <p id="rev-land-area">—</p>
            </div>
            <div className="review-item">
              <h5>Right of Way (RoW)</h5>
              <p id="rev-row-avail">—</p>
            </div>
          </div>
        </div>

        {/* Submitter / Nodal Officer Contact Information */}
        <div className="review-box">
          <div className="review-box-header">
            <span className="review-box-title">4. Submitting Nodal Officer / Authorized Agency Signatory</span>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="p-contact-name" className="form-label">Full Name <span className="req">*</span></label>
              <input type="text" id="p-contact-name" className="form-input" placeholder="e.g. Rajesh Kumar Sharma" required />
            </div>

            <div className="form-field">
              <label htmlFor="p-contact-desig" className="form-label">Official Designation <span className="req">*</span></label>
              <input type="text" id="p-contact-desig" className="form-input"
                placeholder="e.g. Chief General Manager (Projects) / Project Director" required />
            </div>

            <div className="form-field">
              <label htmlFor="p-contact-email" className="form-label">Official Email ID <span className="req">*</span></label>
              <input type="email" id="p-contact-email" className="form-input"
                placeholder="name@agency.org or officer@gov.in" required />
            </div>

            <div className="form-field">
              <label htmlFor="p-contact-phone" className="form-label">Official Contact Number <span className="req">*</span></label>
              <input type="tel" id="p-contact-phone" className="form-input" placeholder="10-digit phone number" required />
            </div>
          </div>
        </div>

        {/* Official Declaration Checkbox */}
        <div className="declaration-box">
          <input type="checkbox" id="declaration-check" />
          <label htmlFor="declaration-check">
            I hereby declare and confirm that the project particulars, financial estimates, milestone dates, and
            statutory clearance statuses submitted herein have been authenticated against official administrative
            sanction orders and are accurate to the best of my knowledge.
          </label>
        </div>

      </div>
    </section>

    {/* ================= BOTTOM NAVIGATION & ACTION BAR ================= */}
    <div className="step-actions-bar">
      <div>
        <button type="button" className="btn-step btn-prev" id="btn-prev-step" style={{visibility: 'hidden'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Previous Stage
        </button>
      </div>

      <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
        <button type="button" className="btn-step btn-prev" id="btn-save-draft-bottom">
          Save Draft
        </button>

        <button type="button" className="btn-step btn-next" id="btn-next-step">
          <span>Continue to Next Stage</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <button type="button" className="btn-step btn-submit-final" id="btn-submit-final" style={{display: 'none'}} disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Submit for Review</span>
        </button>
      </div>
    </div>

        </main>

        <Footer />
      </div>

      {/* ================= SUBMISSION SUCCESS MODAL ================= */}
      <div className="success-modal-backdrop" id="success-modal">
        <div className="success-modal-card">
          <div className="success-icon-badge">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h3 className="success-modal-title">Project Successfully Submitted!</h3>
          <p className="success-modal-sub">
            Your project details have been successfully ingested into the NIVARA Central Repository of Projects. Initial
            risk signals and automated timeline forecasting will begin processing.
          </p>

          <div className="project-id-chip-box">
            <span>GENERATED NIVARA PROJECT ID</span>
            <strong id="modal-display-project-id">NIV-2026-PRJ-XXXX</strong>
            <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>Tracking No: <span
                id="modal-display-tracking-no">TRK-XXXXXXXX</span></div>
          </div>

          <div style={{display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px'}}>
            <Link to="/reports" className="btn-step btn-next" style={{textDecoration: 'none'}}>View in Reports Portal</Link>
            <Link to="/dashboard" className="btn-step btn-prev" style={{textDecoration: 'none'}}>Return to Dashboard</Link>
          </div>
        </div>
      </div>

      {/* ================= TOAST NOTIFICATION ================= */}
      <div className="toast-notice" id="toast-notice">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span id="toast-message">Notification message</span>
      </div>
    </div>
  );
};

export default AddProject;
