import React, { useState } from 'react';
import delayApi from '../api/delayApi';

const DelayClassifierModal = ({ isOpen, onClose }) => {
  const [projectId, setProjectId] = useState('NH27-BR-001');
  const [remarkText, setRemarkText] = useState('Delay due to pending forest clearance from state forest department and environmental impact assessment sign-off.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleClassify = async (e) => {
    e.preventDefault();
    if (!remarkText.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await delayApi.classifyRemark(projectId, remarkText);
      if (res.success) {
        setResult(res.classification);
      }
    } catch (err) {
      alert("Classification request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-modal-backdrop active" onClick={e => { if (e.target.classList.contains('reports-modal-backdrop')) onClose(); }}>
      <div className="reports-modal-card" style={{ maxWidth: '750px' }}>
        <div className="reports-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: '#7c3aed' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div className="modal-header-titles">
              <h2>NLP-Based Delay Reason Classifier</h2>
              <p>Automated parsing and categorization of nodal officials' delay remarks</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="reports-modal-body" style={{ padding: '24px 28px' }}>
          <form onSubmit={handleClassify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Project Reference</label>
              <input
                type="text"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Official Delay Remark / Field Inspection Note</label>
              <textarea
                rows={4}
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                placeholder="Enter official delay explanation remark..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', lineHeight: '1.5' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !remarkText.trim()}
              style={{ background: '#7c3aed', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'background 0.15s' }}
            >
              {loading ? "Analyzing Text with NIVARA NLP Engine..." : "Analyze & Classify Remark →"}
            </button>
          </form>

          {result && (
            <div style={{ marginTop: '24px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px 22px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>NLP Analysis Output</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>{result.label}</span>
                <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '12px', fontWeight: '800', padding: '5px 12px', borderRadius: '12px' }}>
                  Category Code: {result.category}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Classification Confidence:</span>
                <div style={{ flex: 1, background: '#e2e8f0', height: '9px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(result.confidence * 100)}%`, background: '#7c3aed', height: '100%' }}></div>
                </div>
                <strong style={{ fontSize: '13.5px', color: '#7c3aed' }}>{Math.round(result.confidence * 100)}%</strong>
              </div>

              {/* Categorized Statistics Overview */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>National Sector Classification Breakdown:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', fontSize: '12.5px' }}>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    🌳 Forest/Env Clearance: <strong>38%</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    🏞️ Land Acquisition: <strong>31%</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    🚜 Contractor Issues: <strong>19%</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    💰 Funding Disbursal: <strong>12%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DelayClassifierModal;
