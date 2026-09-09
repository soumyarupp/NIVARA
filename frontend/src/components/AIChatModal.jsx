import React, { useState } from 'react';
import chatApi from '../api/chatApi';

const AIChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Greetings. I am the NIVARA Infrastructure AI Assistant. Ask questions in natural language to inspect project risks, timeline delays, costs, and state telemetry.',
      projects: null
    }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await chatApi.queryChatbot(userText);
      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: res.answer,
            projects: res.projects || null
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: "Unable to retrieve project intelligence. Please check system connectivity and try again.", projects: null }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (sampleText) => {
    setQuery(sampleText);
  };

  return (
    <div className="reports-modal-backdrop active" onClick={e => { if (e.target.classList.contains('reports-modal-backdrop')) onClose(); }}>
      <div className="reports-modal-card" style={{ maxWidth: '850px', height: '80vh' }}>
        <div className="reports-modal-header" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: '#6366f1' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="modal-header-titles">
              <h2>Interactive Dashboard &amp; AI Chatbot</h2>
              <p>Natural language intelligence assistant for Central Sector Mega Projects</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="reports-modal-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 75px)', padding: '16px' }}>
          
          {/* Quick sample prompt chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap', alignSelf: 'center' }}>Suggested:</span>
            {[
              "Show me all high-risk road projects in Bihar over ₹500 crore",
              "Send alert to nodal officer for NH-27",
              "List critical rail projects with land acquisition delays"
            ].map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(sample)}
                style={{
                  background: '#e0e7ff',
                  color: '#3730a3',
                  border: '1px solid #c7d2fe',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div
                  style={{
                    background: m.sender === 'user' ? '#4f46e5' : '#f1f5f9',
                    color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    lineHeight: '1.5'
                  }}
                >
                  {m.text}
                </div>

                {/* Structured project results table if returned by query */}
                {m.projects && m.projects.length > 0 && (
                  <div style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlgin: 'left' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0', color: '#334155' }}>
                          <th style={{ padding: '6px 10px' }}>Project ID</th>
                          <th style={{ padding: '6px 10px' }}>Name</th>
                          <th style={{ padding: '6px 10px' }}>Cost</th>
                          <th style={{ padding: '6px 10px' }}>Risk Level</th>
                          <th style={{ padding: '6px 10px' }}>Delay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.projects.map((p, pIdx) => (
                          <tr key={pIdx} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: '700' }}>{p.id}</td>
                            <td style={{ padding: '6px 10px', fontWeight: '600' }}>{p.name}</td>
                            <td style={{ padding: '6px 10px' }}>₹{p.cost} Cr</td>
                            <td style={{ padding: '6px 10px' }}>
                              <span className={`risk-level-pill ${p.riskLevel.toLowerCase()}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                {p.riskLevel}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', color: '#b91c1c', fontWeight: '700' }}>+{p.delayDays}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#f1f5f9', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'spin 1s infinite' }}></span>
                Processing inquiry against NIVARA project database...
              </div>
            )}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Ask NIVARA Assistant about project costs, delays, risks, or states..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{ background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13.5px' }}
            >
              Send
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
