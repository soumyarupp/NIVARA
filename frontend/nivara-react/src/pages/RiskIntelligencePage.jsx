import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Reports.css';
import HeaderNav from '../components/HeaderNav';
import Footer from '../components/Footer';
import simulatorApi from '../api/simulatorApi';

// Modal Components
import AlertsModal from '../components/AlertsModal';
import AIChatModal from '../components/AIChatModal';
import DelayClassifierModal from '../components/DelayClassifierModal';
import MismatchDetectorModal from '../components/MismatchDetectorModal';
import PreApprovalSimulatorModal from '../components/PreApprovalSimulatorModal';
import WhatIfSimulatorModal from '../components/WhatIfSimulatorModal';

const RiskIntelligencePage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [inlineDelayMonths, setInlineDelayMonths] = useState(6);
  const [inlineSimResult, setInlineSimResult] = useState({
    estimatedAdditionalCost: 110.4,
    additionalCostPercentage: 12.9,
    newCompletionDate: "2028-12-31"
  });

  useEffect(() => {
    async function updateInlineSim() {
      try {
        const res = await simulatorApi.simulateDelayImpact({
          projectId: 'NH27-BR-001',
          additionalDelayMonths: inlineDelayMonths
        });
        if (res && res.success) {
          setInlineSimResult(res.simulation);
        }
      } catch (e) {}
    }
    const t = setTimeout(updateInlineSim, 100);
    return () => clearTimeout(t);
  }, [inlineDelayMonths]);

  return (
    <div className="dashboard-page-wrapper">
      <HeaderNav activeKey="/risk-intelligence" />

      <main className="page-container">
        {/* ===== PAGE TITLE BANNER ===== */}
        <div className="standalone-reports-page" style={{ padding: '0 0 20px 0' }}>
          <div className="page-title-banner" style={{ margin: '20px 0' }}>
            <h1>AI-Powered Infrastructure Risk Intelligence</h1>
            <p>
              Operational machine learning engines for automated anomaly detection, NLP remarks parsing, fund-versus-physical progress mismatch detection, pre-approval risk scoring, and delay impact simulation.
            </p>
          </div>
        </div>

        {/* ===== THE SIX NIVARA AI FEATURES ===== */}
        <section className="dashboard-section" id="ai-features">
          <div className="ai-features-grid">

            {/* Feature 1 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <h3 className="ai-feature-title">1. AI-Powered Early Warning &amp; Alert System</h3>
                <p className="ai-feature-desc">
                  Automatically monitors project indicators and raises alerts when abnormal spending, progress or reporting delays are detected.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('alerts')}>
                <span>View Alerts</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 2 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="ai-feature-title">2. Interactive Dashboard with AI Chatbot</h3>
                <p className="ai-feature-desc">
                  Ask questions in natural language and instantly retrieve project risks, delays, costs and performance insights.
                </p>
                <div className="query-example-pill">
                  “Show me all high-risk road projects in Bihar over ₹500 crore”
                </div>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('chat')}>
                <span>Open AI Dashboard</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 3 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3 className="ai-feature-title">3. NLP-Based Delay Reason Classifier</h3>
                <p className="ai-feature-desc">
                  Automatically analyzes officials' delay remarks and classifies them into categories such as land acquisition, litigation, clearance, contractor issues and funding.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('delay')}>
                <span>Analyze Delays</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 4 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                </div>
                <h3 className="ai-feature-title">4. Fund vs Physical Progress Mismatch Detector</h3>
                <p className="ai-feature-desc">
                  Compares financial expenditure with reported physical progress and flags suspicious or inconsistent project performance.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('mismatch')}>
                <span>Detect Mismatches</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 5 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="ai-feature-icon" style={{ backgroundColor: '#fae8ff', color: '#a21caf' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <span className="feature-prevent-badge">PREVENT BEFORE IT STARTS</span>
                </div>
                <h3 className="ai-feature-title">5. Pre-Approval Risk Simulator</h3>
                <p className="ai-feature-desc">
                  Predicts potential project risks before approval using historical patterns across sector, state, agency and project size.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('preapproval')}>
                <span>Simulate Project Risk</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 6 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="ai-feature-title">6. What-If Delay Impact Simulator</h3>
                <p className="ai-feature-desc">
                  Simulate additional delays and instantly see their estimated impact on completion date and project cost.
                </p>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    <span>Land Clearance Delay</span>
                    <span style={{ color: '#ea580c' }}>{inlineDelayMonths} months</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={inlineDelayMonths}
                    onChange={e => setInlineDelayMonths(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#ea580c', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Estimated Cost Impact</span>
                      <strong style={{ color: '#c2410c' }}>+₹{inlineSimResult.estimatedAdditionalCost} Cr ({inlineSimResult.additionalCostPercentage}%)</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>New Completion Date</span>
                      <strong style={{ color: '#0f172a' }}>{inlineSimResult.newCompletionDate}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('whatif')}>
                <span>Run Simulation</span>
                <span>&rarr;</span>
              </button>
            </div>

          </div>
        </section>
      </main>

      <Footer />

      {/* AI Modals */}
      <AlertsModal isOpen={activeModal === 'alerts'} onClose={() => setActiveModal(null)} />
      <AIChatModal isOpen={activeModal === 'chat'} onClose={() => setActiveModal(null)} />
      <DelayClassifierModal isOpen={activeModal === 'delay'} onClose={() => setActiveModal(null)} />
      <MismatchDetectorModal isOpen={activeModal === 'mismatch'} onClose={() => setActiveModal(null)} />
      <PreApprovalSimulatorModal isOpen={activeModal === 'preapproval'} onClose={() => setActiveModal(null)} />
      <WhatIfSimulatorModal isOpen={activeModal === 'whatif'} onClose={() => setActiveModal(null)} />
    </div>
  );
};

export default RiskIntelligencePage;
