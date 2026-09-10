import React, { useState } from 'react';
import simulatorApi from '../api/simulatorApi';

const PreApprovalSimulatorModal = ({ isOpen, onClose }) => {
  const [sector, setSector] = useState('Power & Energy');
  const [state, setState] = useState('Odisha');
  const [agency, setAgency] = useState('NTPC Limited');
  const [estimatedCost, setEstimatedCost] = useState(2500);
  const [projectDurationMonths, setProjectDurationMonths] = useState(36);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await simulatorApi.simulatePreApproval({
        sector,
        state,
        agency,
        estimatedCost,
        projectDurationMonths
      });
      if (res.success) {
        setResult(res.prediction);
      }
    } catch (err) {
      alert("Pre-approval simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-modal-backdrop active" onClick={e => { if (e.target.classList.contains('reports-modal-backdrop')) onClose(); }}>
      <div className="reports-modal-card" style={{ maxWidth: '800px' }}>
        <div className="reports-modal-header" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: '#4c1d95' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="modal-header-titles">
              <h2>Pre-Approval Risk Simulator</h2>
              <p>Predict potential risks before project sanction using historical sector &amp; state patterns</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="reports-modal-body" style={{ padding: '24px 28px' }}>
          <form onSubmit={handleSimulate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Sector</label>
              <select value={sector} onChange={e => setSector(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}>
                <option value="Roads & Highways">Roads &amp; Highways</option>
                <option value="Railways">Railways</option>
                <option value="Power & Energy">Power &amp; Energy</option>
                <option value="Urban Transit">Urban Transit</option>
                <option value="Ports & Shipping">Ports &amp; Shipping</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>State / Region</label>
              <select value={state} onChange={e => setState(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}>
                <option value="Odisha">Odisha</option>
                <option value="Bihar">Bihar</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Assam">Assam</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Implementing Agency</label>
              <input type="text" value={agency} onChange={e => setAgency(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Estimated Outlay (₹ Cr)</label>
              <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Planned Duration (Months)</label>
              <input type="number" value={projectDurationMonths} onChange={e => setProjectDurationMonths(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#6b21a8', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'background 0.15s' }}>
                {loading ? "Running Historical Benchmark Simulation..." : "Simulate Pre-Approval Risk Profile →"}
              </button>
            </div>
          </form>

          {result && (
            <div style={{ background: '#fcf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#6b21a8', letterSpacing: '0.5px' }}>AI / MODEL PREDICTION OUTPUT</span>
                <span className={`risk-level-pill ${result.riskLevel.toLowerCase()}`}>
                  {result.riskLevel} PRE-APPROVAL RISK
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #f3e8ff' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700' }}>Predicted Timeline Delay</span>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#b91c1c' }}>+{result.predictedDelayMonths} Months</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Historical Sector Average: {result.historicalAverageDelayMonths} Mos</span>
                </div>

                <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #f3e8ff' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700' }}>Primary Anticipated Bottleneck</span>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{result.majorRiskFactor}</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f3e8ff', fontSize: '12.5px', color: '#334155' }}>
                <strong>Strategic Recommendation:</strong> {result.recommendation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreApprovalSimulatorModal;
