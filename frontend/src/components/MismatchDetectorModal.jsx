import React, { useState } from 'react';
import mismatchApi from '../api/mismatchApi';

const MismatchDetectorModal = ({ isOpen, onClose }) => {
  const [projectId, setProjectId] = useState('OD-CRP-001');
  const [totalBudget, setTotalBudget] = useState(800);
  const [expenditure, setExpenditure] = useState(680);
  const [physicalProgress, setPhysicalProgress] = useState(40);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await mismatchApi.detectMismatch({
        projectId,
        totalBudget,
        expenditure,
        physicalProgress
      });
      if (res.success) {
        setResult(res.analysis);
      }
    } catch (err) {
      alert("Mismatch detection query failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-modal-backdrop active" onClick={e => { if (e.target.classList.contains('reports-modal-backdrop')) onClose(); }}>
      <div className="reports-modal-card" style={{ maxWidth: '800px' }}>
        <div className="reports-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: '#0284c7' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
            </div>
            <div className="modal-header-titles">
              <h2>Fund vs. Physical Progress Mismatch Detector</h2>
              <p>Compares financial expenditure with reported milestone physical progress</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="reports-modal-body" style={{ padding: '24px 28px' }}>
          <form onSubmit={handleAnalyze} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Project ID</label>
              <input type="text" value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Total Sanctioned Budget (₹ Cr)</label>
              <input type="number" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Financial Expenditure Disbursed (₹ Cr)</label>
              <input type="number" value={expenditure} onChange={e => setExpenditure(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Reported Physical Progress (%)</label>
              <input type="number" value={physicalProgress} onChange={e => setPhysicalProgress(e.target.value)} min="0" max="100" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#0284c7', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'background 0.15s' }}>
                {loading ? "Calculating Telemetry Discrepancy..." : "Detect Mismatch & Evaluate Risk →"}
              </button>
            </div>
          </form>

          {result && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Telemetry Discrepancy Report</h4>
                <span className={`risk-level-pill ${result.riskLevel.toLowerCase()}`}>
                  {result.riskLevel} MISMATCH RISK
                </span>
              </div>

              {/* Progress Comparison Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>
                    <span>Financial Outlay Spent</span>
                    <span style={{ color: '#0284c7' }}>{result.expenditurePercentage}% Utilized</span>
                  </div>
                  <div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${result.expenditurePercentage}%`, background: '#0284c7', height: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>
                    <span>Physical Milestone Progress</span>
                    <span style={{ color: '#0d9488' }}>{result.physicalProgressPercentage}% Completed</span>
                  </div>
                  <div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${result.physicalProgressPercentage}%`, background: '#0d9488', height: '100%' }}></div>
                  </div>
                </div>
              </div>

              {/* Mismatch Stat Highlight Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#b91c1c', marginBottom: '4px' }}>
                  Potential Discrepancy Margin: +{result.mismatchPercentage}% Variance
                </div>
                <p style={{ fontSize: '12.5px', color: '#334155', margin: 0 }}>
                  {result.reason}
                </p>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <strong>Recommendation:</strong> {result.recommendation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MismatchDetectorModal;
