import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [thread, setThread] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    const { data } = await axios.get('http://localhost:5000/api/results');
    setResults(data);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    await axios.post('http://localhost:5000/api/analyze', { threadText: thread });
    await fetchResults();
    setThread('');
    setLoading(false);
  };

  const chartData = results.map((r, i) => ({
    name: `Thread ${i + 1}`,
    sentiment: parseFloat(r.sentimentScore.toFixed(2))
  }));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Fan Discussion Analyzer</h1>
      
      <textarea
        rows={6} style={{ width: '100%', marginBottom: 12 }}
        placeholder="Paste a fan discussion thread here..."
        value={thread}
        onChange={e => setThread(e.target.value)}
      />
      <button onClick={handleAnalyze} disabled={loading || !thread}>
        {loading ? 'Analyzing...' : 'Analyze with AI'}
      </button>

      <h2>Sentiment Trend</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis domain={[-1, 1]} />
          <Tooltip />
          <Bar dataKey="sentiment" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Recent Analyses</h2>
      {results.map(r => (
        <div key={r._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12, borderRadius: 8 }}>
          <p><strong>Summary:</strong> {r.summary}</p>
          <p><strong>Topics:</strong> {r.topics?.join(', ')}</p>
          <p><strong>Sentiment:</strong> {r.sentimentScore} | <strong>Engagement:</strong> {r.engagementLevel}</p>
        </div>
      ))}
    </div>
  );
}