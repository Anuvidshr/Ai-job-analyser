import { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ScoreRing = ({ score }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      <text x="70" y="65" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{score}</text>
      <text x="70" y="85" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">/ 100</text>
    </svg>
  );
};

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('analyze');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${API}/api/results`);
      setHistory(data);
    } catch (e) {}
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDesc.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/api/analyze`, {
        resumeText,
        jobDescription: jobDesc
      });
      setResult(data);
      fetchHistory();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Analysis failed. Make sure backend is running on port 5000.';
      setError(errorMsg);
    }
    setLoading(false);
  };

  const downloadReport = () => {
    if (!result) return;
    const content = `RESUME MATCH REPORT
Generated: ${new Date().toLocaleString()}
${'='.repeat(50)}

MATCH SCORE: ${result.matchScore}/100
VERDICT: ${result.verdict}

STRENGTHS:
${result.strengths?.map(s => '  • ' + s).join('\n')}

GAPS:
${result.gaps?.map(g => '  • ' + g).join('\n')}

SUGGESTIONS TO IMPROVE:
${result.suggestions?.map(s => '  • ' + s).join('\n')}

KEYWORD ANALYSIS:
${result.keywords?.map(k => '  ' + k).join('\n')}
${'='.repeat(50)}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-analysis-report.txt';
    a.click();
  };

  const verdictColor = (v) => {
    if (!v) return '#6b7280';
    if (v.includes('Excellent')) return '#22c55e';
    if (v.includes('Good')) return '#84cc16';
    if (v.includes('Partial')) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Georgia', serif", color: '#e2e8f0' }}>

      {/* Animated background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}/>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)' }}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', background: 'rgba(10,10,15,0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📄</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>ResumeIQ</h1>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>AI-Powered Resume Analyzer</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['analyze', 'history'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: tab === t ? '#a5b4fc' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                {t === 'analyze' ? '🔍 Analyze' : '📋 History'}
              </button>
            ))}
          </div>
        </header>

        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

          {tab === 'analyze' && (
            <>
              {/* Input Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Resume Input */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>📝</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, color: '#f1f5f9' }}>Your Resume</h3>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Paste your resume text</p>
                    </div>
                  </div>
                  <textarea
                    rows={14}
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="Paste your full resume here...

Name, contact info, work experience, skills, education, projects..."
                    style={{ width: '100%', padding: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{resumeText.length} characters</p>
                </div>

                {/* Job Description Input */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>💼</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, color: '#f1f5f9' }}>Job Description</h3>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Paste the job posting</p>
                    </div>
                  </div>
                  <textarea
                    rows={14}
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    placeholder="Paste the full job description here...

Job title, responsibilities, required skills, qualifications..."
                    style={{ width: '100%', padding: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{jobDesc.length} characters</p>
                </div>
              </div>

              {/* Analyze Button */}
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !resumeText || !jobDesc}
                  style={{ padding: '14px 48px', background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', boxShadow: loading ? 'none' : '0 0 30px rgba(99,102,241,0.4)', transition: 'all 0.3s' }}
                >
                  {loading ? '⏳ Analyzing your resume...' : '✨ Analyze My Resume'}
                </button>
                {error && (
                  <div style={{ marginTop: 12, padding: '10px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 14, display: 'inline-block' }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Results */}
              {result && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>

                  {/* Score + Verdict */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, marginBottom: 20, alignItems: 'center' }}>
                    <ScoreRing score={result.matchScore} />
                    <div>
                      <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: verdictColor(result.verdict) + '22', border: `1px solid ${verdictColor(result.verdict)}44`, color: verdictColor(result.verdict), fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                        {result.verdict}
                      </div>
                      <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#f1f5f9' }}>
                        {result.matchScore >= 75 ? 'Strong candidate for this role!' : result.matchScore >= 50 ? 'Some improvements needed' : 'Resume needs significant tailoring'}
                      </h2>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
                        Your resume matches {result.matchScore}% of the job requirements. {result.matchScore < 75 ? 'Follow the suggestions below to improve your chances.' : 'You are well positioned for this role!'}
                      </p>
                      <button onClick={downloadReport} style={{ marginTop: 16, padding: '8px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}>
                        ⬇️ Download Report
                      </button>
                    </div>
                  </div>

                  {/* 3 column grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

                    {/* Strengths */}
                    <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 16, padding: 20 }}>
                      <h3 style={{ margin: '0 0 16px', color: '#22c55e', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>✅ Strengths</h3>
                      {result.strengths?.map((s, i) => (
                        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5 }}>
                          {s}
                        </div>
                      ))}
                    </div>

                    {/* Gaps */}
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 16, padding: 20 }}>
                      <h3 style={{ margin: '0 0 16px', color: '#f87171', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>❌ Gaps</h3>
                      {result.gaps?.map((g, i) => (
                        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5 }}>
                          {g}
                        </div>
                      ))}
                    </div>

                    {/* Suggestions */}
                    <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 20 }}>
                      <h3 style={{ margin: '0 0 16px', color: '#a5b4fc', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>💡 Suggestions</h3>
                      {result.suggestions?.map((s, i) => (
                        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5 }}>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                    <h3 style={{ margin: '0 0 16px', color: '#f1f5f9', fontSize: 15 }}>🔑 Keyword Analysis</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {result.keywords?.map((k, i) => {
                        const present = k.startsWith('✓');
                        return (
                          <span key={i} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: present ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', color: present ? '#4ade80' : '#f87171', border: `1px solid ${present ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}` }}>
                            {k}
                          </span>
                        );
                      })}
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                      ✓ = Found in your resume &nbsp;|&nbsp; ✗ = Missing from your resume
                    </p>
                  </div>

                </div>
              )}
            </>
          )}

          {tab === 'history' && (
            <div>
              <h2 style={{ color: '#f1f5f9', marginBottom: 24 }}>📋 Analysis History</h2>
              {history.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <p>No analyses yet. Go analyze your resume!</p>
                </div>
              )}
              {history.map(h => (
                <div key={h._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: h.matchScore >= 75 ? '#22c55e' : h.matchScore >= 50 ? '#f59e0b' : '#ef4444' }}>{h.matchScore}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>/ 100</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: verdictColor(h.verdict), fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{h.verdict}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{h.resumeText?.slice(0, 80)}...</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
        textarea:focus { border-color: rgba(99,102,241,0.4) !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}