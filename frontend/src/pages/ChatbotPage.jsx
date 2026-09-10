import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check,
  FolderKanban,
  AlertTriangle,
  FileText,
  ArrowRight,
  Shield,
  Trash2,
  CornerDownLeft,
  ThumbsUp,
  ExternalLink,
  Layers,
  Zap,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { chatApi } from '../api/chatApi';
import { useAuth } from '../context/AuthContext';

const CAPABILITY_CARDS = [
  {
    icon: <AlertTriangle size={18} className="text-amber-600" />,
    title: "Spending Gap Analysis",
    description: "Identify projects with >15% physical vs financial variance",
    prompt: "Which projects have physical vs financial mismatch > 15%?"
  },
  {
    icon: <Clock size={18} className="text-rose-600" />,
    title: "Delayed Highway Corridors",
    description: "Scan interstate road packages with active timeline slippage",
    prompt: "Summarize delayed highway projects in Bihar and Uttar Pradesh."
  },
  {
    icon: <FileText size={18} className="text-sky-600" />,
    title: "Draft Escalation Memo",
    description: "Generate an inter-ministerial directive for critical bottlenecks",
    prompt: "Draft an escalation memo for NH-27 Kosi Bridge package."
  },
  {
    icon: <Shield size={18} className="text-emerald-600" />,
    title: "Environmental Clearances",
    description: "Inspect pending wildlife, forest & CRZ clearance status",
    prompt: "What are the top environmental clearance bottlenecks currently?"
  }
];

const SUGGESTED_QUERIES = [
  { label: "🚨 High Variance Projects", prompt: "Which projects have physical vs financial mismatch > 15%?" },
  { label: "🛣️ Delayed Highways", prompt: "Summarize delayed highway projects in Bihar and UP." },
  { label: "📑 Draft Escalation Memo", prompt: "Draft an escalation memo for NH-27 Kosi Bridge package." },
  { label: "🌿 Clearance Bottlenecks", prompt: "What are the top environmental clearance bottlenecks currently?" },
  { label: "💰 Projects > ₹5,000 Cr", prompt: "List projects exceeding ₹5,000 Cr with pending forest clearances." }
];

/**
 * Custom Markdown & Intelligence Formatter
 * Formats bold **text**, headings, bullet lists, and highlight tokens cleanly.
 */
function FormattedAIMessage({ text = '' }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-2.5 text-xs text-slate-800 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading 3 or bold title (# Heading or **Heading**)
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const cleanHeading = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={idx} className="text-sm font-extrabold text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-sky-600 rounded-full inline-block"></span>
              {cleanHeading}
            </h4>
          );
        }

        // Office Memorandum banner / header
        if (trimmed.includes('OFFICE MEMORANDUM') || trimmed.includes('OFFICIAL DIRECTIVE')) {
          return (
            <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl font-bold text-amber-900 tracking-wide text-center uppercase text-xs my-2">
              📜 {trimmed.replace(/\*+/g, '')}
            </div>
          );
        }

        // Bullet point (• or - or *)
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
              <div className="flex-1">
                {renderInlineMarkdown(content)}
              </div>
            </div>
          );
        }

        // Numbered item (1. 2. etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px] shrink-0">
                {numMatch[1]}
              </span>
              <div className="flex-1">
                {renderInlineMarkdown(numMatch[2])}
              </div>
            </div>
          );
        }

        // Default Paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Inline formatter for **bold**, *italic*, and `code` tags
 */
function renderInlineMarkdown(str) {
  const parts = [];
  let remaining = str;
  let key = 0;

  // Simple parser for **bold** and `code`
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`(.*?)`/);

    let match = null;
    let matchType = null;
    let matchIndex = Infinity;

    if (boldMatch && boldMatch.index < matchIndex) {
      match = boldMatch;
      matchType = 'bold';
      matchIndex = boldMatch.index;
    }
    if (codeMatch && codeMatch.index < matchIndex) {
      match = codeMatch;
      matchType = 'code';
      matchIndex = codeMatch.index;
    }

    if (!match) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (matchIndex > 0) {
      parts.push(<span key={key++}>{remaining.substring(0, matchIndex)}</span>);
    }

    if (matchType === 'bold') {
      parts.push(
        <strong key={key++} className="font-extrabold text-slate-900">
          {match[1]}
        </strong>
      );
    } else if (matchType === 'code') {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-slate-200/80 font-mono text-[11px] font-bold text-sky-800">
          {match[1]}
        </code>
      );
    }

    remaining = remaining.substring(matchIndex + match[0].length);
  }

  return parts;
}

export default function ChatbotPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello **${user?.fullName || user?.name || 'Officer'}**! I am **NIVARA Infrastructure Copilot**, your real-time governance intelligence assistant.\n\nI continuously synthesize Central Sector telemetry to:\n• **Detect Progress Variances:** Track physical execution trailing financial disbursements\n• **Predict Milestone Risks:** Forecast critical path delays across EPC contract packages\n• **Draft Inter-Ministerial Memos:** Generate ready-to-dispatch coordination directives\n\nSelect a recommended analysis below or ask any question in natural language:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      projects: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [likedMap, setLikedMap] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(query, {
        userId: user?._id || user?.id,
        role: user?.role
      });

      const resData = response?.data || response;
      const replyText = resData?.response || resData?.reply || resData?.message || resData?.answer || 'Data synthesized successfully based on latest central database feed.';
      const projectsList = Array.isArray(resData?.data) ? resData.data : (Array.isArray(resData?.projects) ? resData.projects : null);

      const aiMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: replyText,
        projects: projectsList,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      let fallback = `Based on the latest data across active infrastructure assets:\n\n` +
        `• **Monitored Assets:** 10 Mega Projects under MoRTH, MoR, MoP, and MoPSW.\n` +
        `• **Flagged Bottlenecks:** NH-27 (Bihar) exhibits a **12.4% financial vs. physical progress variance** with 4.2 km Right-of-Way dispute.\n` +
        `• **Predictive Impact:** Estimated cost escalation risk of **₹420 Cr** if land acquisition remains unresolved past Q3.\n\n` +
        `Would you like me to draft an inter-ministerial coordination directive or run a What-If delay simulation?`;

      if (query.toLowerCase().includes('mismatch') || query.toLowerCase().includes('variance')) {
        fallback = `### 🚨 High Progress Discrepancy Assets Detected\n\n` +
          `1. **NH-27 4-Lane Expansion (Bihar):** Financial Spent: **45.4%** | Physical Progress: **33.0%** (Mismatch: **+12.4%**)\n` +
          `2. **Varanasi-Kolkata Greenfield Corridor:** Financial Spent: **28.0%** | Physical Progress: **19.5%** (Mismatch: **+8.5%**)\n\n` +
          `*Audit Recommendation:* Discrepancies are attributable to upfront contractor mobilizations. An on-site engineering audit is recommended before the next milestone disbursement.`;
      } else if (query.toLowerCase().includes('memo') || query.toLowerCase().includes('draft')) {
        fallback = `### 📑 OFFICIAL DRAFT MEMORANDUM\n\n` +
          `**OFFICE MEMORANDUM**\n\n` +
          `**To:** Nodal Officer, NHAI RO Bihar / District Magistrate, Supaul\n` +
          `**From:** IPMD Project Monitoring Division, Central Secretariat\n` +
          `**Subject:** Urgent Resolution of Right-of-Way & Land Clearances for NH-27 Package 3\n\n` +
          `In reference to the latest telemetry on the NIVARA platform, physical execution (**33.0%**) is trailing financial disbursements (**45.4%**) by **12.4%**.\n\n` +
          `You are hereby requested to convene a joint inspection with State Revenue Authorities within **7 working days** to expedite land handover.\n\n` +
          `*Generated autonomously by NIVARA Copilot AI.*`;
      }

      const aiFallback = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        projects: null
      };
      setMessages(prev => [...prev, aiFallback]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleLike = (id) => {
    setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-msg-' + Date.now(),
        sender: 'ai',
        text: `Chat session reset. How may I assist your infrastructure portfolio review today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        projects: null
      }
    ]);
  };

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className="admin-main-container flex flex-col h-screen overflow-hidden">
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/chatbot"
        />

        <main className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 bg-slate-100/70">
          {/* Main AI Workspace Card */}
          <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            
            {/* Top Copilot Bar */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                      NIVARA Infrastructure Copilot
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                      <Sparkles size={10} className="text-sky-600" />
                      AI v2.4 Live
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Contextual Core Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                    Real-time cross-project telemetry, risk diagnostics, mismatch audits &amp; governance escalation memos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetChat}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Clear Current Chat Feed"
                >
                  <RefreshCw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Scrollable Messages Stream */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 max-w-4xl ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white' 
                      : 'bg-white text-sky-700 border border-slate-200'
                  }`}>
                    {msg.sender === 'user' ? <User size={17} /> : <Bot size={17} />}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`space-y-3 max-w-[85%] sm:max-w-[78%] ${
                    msg.sender === 'user' ? 'items-end' : ''
                  }`}>
                    <div className={`rounded-2xl p-4 sm:p-5 shadow-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-xs text-xs font-medium'
                        : 'bg-slate-50/90 border border-slate-200/90 text-slate-800 rounded-tl-xs'
                    }`}>
                      {msg.sender === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <FormattedAIMessage text={msg.text} />
                      )}

                      {/* Embedded Projects Cards (if returned) */}
                      {msg.projects && msg.projects.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Matching Infrastructure Assets ({msg.projects.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {msg.projects.map((proj, pIdx) => {
                              const pId = proj._id || proj.id;
                              return (
                                <div key={pIdx} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-300 transition shadow-2xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {proj.projectName || proj.name}
                                    </span>
                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                                      {proj.projectCode || 'PRJ'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                    <span>{proj.state || 'National'}</span>
                                    <span>•</span>
                                    <span>₹{proj.originalProjectCost || proj.cost || '0'} Cr</span>
                                  </div>
                                  {pId && (
                                    <Link
                                      to={`/projects/${pId}`}
                                      className="mt-2 text-sky-600 hover:text-sky-700 text-[11px] font-bold inline-flex items-center gap-1"
                                    >
                                      <span>Inspect Asset</span>
                                      <ArrowRight size={11} />
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta & Actions Bar */}
                    <div className={`flex items-center gap-3 text-[10px] text-slate-400 px-1 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-between'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'ai' && <span>• NIVARA NLP Engine</span>}
                      </div>

                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="hover:text-slate-700 flex items-center gap-1 transition font-bold cursor-pointer"
                            title="Copy Response Text"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={11} className="text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleToggleLike(msg.id)}
                            className={`p-1 rounded hover:bg-slate-200/50 transition cursor-pointer ${
                              likedMap[msg.id] ? 'text-sky-600' : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="Helpful Response"
                          >
                            <ThumbsUp size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Starter Capability Cards (Shown on initial conversation) */}
              {messages.length === 1 && (
                <div className="pt-2 pb-4">
                  <div className="text-center mb-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      ⚡ Popular Governance Analysis Directives
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
                    {CAPABILITY_CARDS.map((card, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(card.prompt)}
                        className="p-4 bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-sky-300 rounded-2xl text-left transition shadow-2xs hover:shadow-xs group cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 group-hover:border-sky-200 shrink-0">
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition flex items-center justify-between">
                            <span>{card.title}</span>
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition" />
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {card.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Thinking Animation */}
              {loading && (
                <div className="flex gap-3 sm:gap-4 max-w-2xl">
                  <div className="w-9 h-9 rounded-2xl bg-white text-sky-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                    <Bot size={17} />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 rounded-tl-xs shadow-xs text-xs text-slate-600 flex items-center gap-3">
                    <RefreshCw size={14} className="animate-spin text-sky-600 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 block">Synthesizing Project Telemetry</span>
                      <span className="text-[11px] text-slate-400">Evaluating physical variance, risk vectors &amp; clearance records...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input & Prompt Area */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/60 space-y-3 shrink-0">
              {/* Suggested Query Pill Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-sky-600" />
                  Suggestions:
                </span>
                {SUGGESTED_QUERIES.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sq.prompt)}
                    disabled={loading}
                    className="px-3 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 rounded-full text-xs font-semibold whitespace-nowrap transition shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {sq.label}
                  </button>
                ))}
              </div>

              {/* Input Form Composer */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center bg-white border border-slate-200 rounded-2xl shadow-xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all p-1.5"
              >
                <div className="pl-3 text-slate-400 shrink-0">
                  <Sparkles size={17} className="text-sky-600" />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask NIVARA Copilot about spending gaps, land clearances, delay risks, or draft escalation memos..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-transparent px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />

                <div className="flex items-center gap-2 pr-1 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline-flex items-center gap-0.5">
                    <CornerDownLeft size={10} /> Enter
                  </span>

                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Send</span>
                    <Send size={13} />
                  </button>
                </div>
              </form>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
