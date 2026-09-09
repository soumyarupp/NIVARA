import React, { useState, useEffect } from 'react';
import simulatorApi from '../api/simulatorApi';

const WhatIfSimulatorModal = ({ isOpen, onClose }) => {
  const [projectId, setProjectId] = useState('NH27-BR-001');
  const [delayMonths, setDelayMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState({
    originalCompletionDate: "2028-06-30",
    newCompletionDate: "2028-12-31",
    additionalCostPercentage: 12.9,
    estimatedAdditionalCost: 110.4,
    riskLevel: "HIGH"
  });

  useEffect(() => {
    if (!isOpen) return;
    async function runSim() {
      setLoading(true);
      try {
        const res = await simulatorApi.simulateDelayImpact({
          projectId,
          additionalDelayMonths: delayMonths
        });
        if (res.success) {
          setSimulation(res.simulation);
        }
      } catch (err) {
        console.error("Delay impact simulation error:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(runSim, 150); // debounce API call
    return () => clearTimeout(timer);
  }, [isOpen, projectId, delayMonths]);

  if (!isOpen) return null;

  return (
    <div className="reports-modal-backdrop active" onClick={e => { if (e.target.classList.contains('reports-modal-backdrop')) onClose(); }}>
      <div className="reports-modal-card" style={{ maxWidth: '800px' }}>
        <div className="reports-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: '#ea580c' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="modal-header-titles">
              <h2>What-If Delay Impact Simulator</h2>
              <p>Simulate timeline escalation and quantify real-time cost overruns</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="reports-modal-body">
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                Additional Delay Projection: <span style={{ color: '#ea580c', fontSize: '18px' }}>{delayMonths} Months</span>
              </label>
              <span className={`risk-level-pill ${simulation.riskLevel.toLowerCase()}`}>
                {simulation.riskLevel} ESCALATION
              </span>
            </div>

            {/* Slider */}
            <div style={{ padding: '0 8px', marginBottom: '20px' }}>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={delayMonths}
                onChange={e => setDelayMonths(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#ea580c', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                <span>0 months (On Time)</span>
                <span>3 mos</span>
                <span>6 mos</span>
                <span>9 mos</span>
                <span>12 months (Severe)</span>
              </div>
            </div>

            {/* Simulation Results Display Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', padding: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase' }}>Estimated Outlay Cost Overrun</span>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#9a3412', marginTop: '4px' }}>
                  +₹{simulation.estimatedAdditionalCost} Cr
                </div>
                <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '700' }}>
                  (+{simulation.additionalCostPercentage}% budget inflation)
                </span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Revised Completion Date</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                  {simulation.newCompletionDate}
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Baseline Completion: {simulation.originalCompletionDate}
                </span>
              </div>
            </div>

          </div>

          <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
            {loading ? "Recalculating ML escalation models..." : "Adjust slider to evaluate sensitivity across milestone packages."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulatorModal;
