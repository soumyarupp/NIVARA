/**
 * add-project.js
 * -------------------------------------------------------------------------------------
 * State Management, Validation, Dynamic Fields, and Submission for NIVARA Add Project Form
 * -------------------------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
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
});
