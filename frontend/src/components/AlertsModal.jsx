import React, { useState, useEffect } from 'react';
import alertApi from '../api/alertApi';

const AlertsModal = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    async function fetchAlerts() {
      setLoading(true);
      setError(null);
      try {
        const res = await alertApi.getAlerts();
        if (res.success) {
          setAlerts(res.alerts || []);
        }
      } catch (err) {
        setError("Unable to retrieve alerts telemetry. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, [isOpen]);

  const handleAcknowledge = async (id) => {
    try {
      await alertApi.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    } catch (err) {
      alert("Failed to acknowledge alert.");
    }
  };

  if (!isOpen) return null;

  const filtered = alerts.filter(a => filterSeverity === 'ALL' || a.severity === filterSeverity);

  return (
    <div className="reports-modal-backdrop active" onClick={e => { if (e.target.classList.contains('reports-modal-backdrop')) onClose(); }}>
      <div className="reports-modal-card" style={{ maxWidth: '850px' }}>
        <div className="reports-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: '#dc2626' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="modal-header-titles">
              <h2>AI-Powered Early Warning &amp; Alert System</h2>
              <p>Automated telemetry monitoring for spending anomalies and milestone slippages</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="reports-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Filter Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFilterSeverity(sev)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: '1px solid #cbd5e1',
                    background: filterSeverity === sev ? '#0284c7' : '#ffffff',
                    color: filterSeverity === sev ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Live Monitoring Feed</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="radar-spinner" style={{ margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Loading project intelligence &amp; telemetry alerts...</p>
            </div>
          ) : error ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px', color: '#b91c1c', fontSize: '13px' }}>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '14px' }}>
              No active alerts matching the selected severity level.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(item => (
                <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className={`risk-level-pill ${item.severity.toLowerCase()}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {item.severity}
                      </span>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{item.projectName}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>[{item.projectId}]</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#334155', margin: '4px 0 8px 0' }}>{item.message}</p>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '12px' }}>
                      <span>Agency: <strong>{item.agency}</strong></span>
                      <span>State: <strong>{item.state}</strong></span>
                      <span>Triggered: <strong>{new Date(item.createdAt).toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div>
                    {item.acknowledged ? (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                        ✓ Acknowledged
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(item.id)}
                        style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Acknowledge Alert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsModal;
