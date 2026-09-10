import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Reports.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
          activeKey="/risk-intelligence"
        />

        {/* Scrollable Main Content */}
        <main className="admin-scrollable-content">
          {/* ===== PAGE TITLE BANNER ===== */}
          <div className="dashboard-banner mb-7">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">AI-Powered Infrastructure Risk Intelligence</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Operational machine learning engines for automated anomaly detection, NLP remarks parsing, fund-versus-physical progress mismatch detection, pre-approval risk scoring, and delay impact simulation.
            </p>
          </div>

          {/* ===== THE SIX NIVARA AI FEATURES ===== */}
          <section id="ai-features">
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
                  <span>Open AI Assistant</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Feature 3 */}
              <div className="ai-feature-card">
                <div className="ai-feature-top">
                  <div className="ai-feature-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <h3 className="ai-feature-title">3. NLP-Based Delay Reason Classifier</h3>
                  <p className="ai-feature-desc">
                    Uses Natural Language Processing to read unstructured text from monthly progress reports and categorize delay reasons.
                  </p>
                </div>
                <button type="button" className="btn-feature-action" onClick={() => setActiveModal('delay')}>
                  <span>Classify Text</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Feature 4 */}
              <div className="ai-feature-card">
                <div className="ai-feature-top">
                  <div className="ai-feature-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  </div>
                  <h3 className="ai-feature-title">4. Fund Allocation vs Physical Mismatch Detector</h3>
                  <p className="ai-feature-desc">
                    Compares fund utilization percentage against actual physical completion to detect financial inflation or slow progress.
                  </p>
                </div>
                <button type="button" className="btn-feature-action" onClick={() => setActiveModal('mismatch')}>
                  <span>Check Mismatches</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Feature 5 */}
              <div className="ai-feature-card">
                <div className="ai-feature-top">
                  <div className="ai-feature-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h3 className="ai-feature-title">5. Pre-Approval Risk Scoring Engine</h3>
                  <p className="ai-feature-desc">
                    Evaluates proposed projects before sanctioning, scoring risks related to land availability, clearances, and contractor load.
                  </p>
                </div>
                <button type="button" className="btn-feature-action" onClick={() => setActiveModal('preapproval')}>
                  <span>Calculate Score</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Feature 6 */}
              <div className="ai-feature-card">
                <div className="ai-feature-top">
                  <div className="ai-feature-icon" style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  </div>
                  <h3 className="ai-feature-title">6. What-If Delay Impact Simulator</h3>
                  <p className="ai-feature-desc">
                    Simulates the domino effect of delays (e.g. land dispute +6 months) on final project cost and completion timeline.
                  </p>

                  {/* Inline Simulator Controls */}
                  <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#475569', fontWeight: '600' }}>Simulate Delay:</span>
                      <strong style={{ color: '#ea580c' }}>+{inlineDelayMonths} Months</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
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
      </div>

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
