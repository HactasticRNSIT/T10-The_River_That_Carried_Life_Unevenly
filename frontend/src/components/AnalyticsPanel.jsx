import { useEffect, useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis // Radar imports added
} from "recharts";

// --- HELPERS ---
function getRecommendation(data, stress) {
  if (!data || !stress) return null;
  const latest = data.timeseries?.slice(-1)[0];
  if (!latest) return null;

  const tips = [];
  if (latest.dissolved_oxygen < 5)
    tips.push("🚨 Critical oxygen depletion detected — investigate industrial discharge upstream.");
  if (latest.nitrate_mgl > 8)
    tips.push("🌾 High nitrate levels suggest agricultural runoff — recommend buffer zone enforcement.");
  if (latest.turbidity_ntu > 20)
    tips.push("💧 Elevated turbidity — check for upstream sediment disturbance or construction.");
  if (latest.rhi < 35)
    tips.push("⛔ River Health Critical — immediate conservation intervention recommended.");
  else if (latest.rhi < 60)
    tips.push("⚠️ Moderate stress detected — increase monitoring frequency to weekly.");
  else
    tips.push("✅ Segment stable — continue routine monitoring schedule.");

  const topStress = [...stress]?.sort((a,b) => b.value - a.value)[0];
  if (topStress?.value > 50)
    tips.push(`📊 Primary stressor: ${topStress.name} (${topStress.value}% probability) — prioritise intervention.`);

  return tips;
}

// --- MAIN COMPONENT ---
export default function AnalyticsPanel({ segmentId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stress, setStress] = useState(null);
  const [subScores, setSubScores] = useState(null); // Radar state added

  useEffect(() => {
    setData(null);
    setStress(null);
    setSubScores(null);
    setError(null);
    setLoading(true);

    fetch(`http://127.0.0.1:8000/segment/${segmentId}?days=60`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        setData(json);

        // Fetch sub-scores from map-data for the radar chart
        fetch(`http://127.0.0.1:8000/map-data`)
          .then(r => r.json())
          .then(all => {
            const seg = all.find(s => s.segment_id === segmentId);
            if (seg?.sub_scores) {
              setSubScores([
                { subject: "Oxygen",      score: seg.sub_scores.do       ?? 0 },
                { subject: "Nitrate",     score: seg.sub_scores.nitrate  ?? 0 },
                { subject: "Turbidity",   score: seg.sub_scores.turbidity ?? 0 },
                { subject: "pH",          score: seg.sub_scores.ph       ?? 0 },
                { subject: "Biodiversity",score: seg.sub_scores.biodiversity ?? 0 },
              ]);
            }
          });

        return fetch(`http://127.0.0.1:8000/stress/${segmentId}`);
      })
      .then(r => r.json())
      .then(s => {
        const formatted = Object.entries(s).map(([name, value]) => ({
          name: name.replace("_", " "),
          value: Math.round(value * 100)
        }));
        setStress(formatted);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [segmentId]);

  return (
    <div style={{ 
      height: 480, background: "#1e293b", padding: 16, 
      borderTop: "2px solid #334155", overflowY: "auto" 
    }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: "#e2e8f0" }}>
          📍 Segment {segmentId} Analysis
        </h2>
        <button onClick={onClose} style={{ 
          background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18 
        }}>✕</button>
      </div>

      {loading && <div style={{ color: "#94a3b8", textAlign: "center", paddingTop: 20 }}>⏳ Loading...</div>}
      {error && <div style={{ color: "#f87171", background: "#450a0a", padding: 10, borderRadius: 6 }}>❌ {error}</div>}

      {data && !loading && (
        <>
          {/* Stats Row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Data points", value: data.timeseries?.length ?? 0 },
              { label: "Forecast", value: `${data.forecast?.length}w` },
              { label: "Latest RHI", value: data.timeseries?.slice(-1)[0]?.rhi?.toFixed(1) ?? "N/A" },
              { label: "Segment", value: data.segment_id },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "#0f172a", borderRadius: 6, padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#38bdf8" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Health Dimension Radar Chart */}
          {subScores && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 4px" }}>
                Health Dimension Breakdown
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={subScores}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Radar dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Recommendations */}
          {(() => {
            const tips = getRecommendation(data, stress);
            return tips ? (
              <div style={{ marginTop: 12, marginBottom: 16, background: "#0f172a", borderRadius: 8,
                padding: 12, border: "1px solid #1e3a5f" }}>
                <p style={{ fontSize: 11, color: "#38bdf8", margin: "0 0 8px", fontWeight: 600 }}>
                  🤖 AI Conservation Recommendations
                </p>
                {tips.map((tip, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#cbd5e1",
                    padding: "4px 0", borderBottom: "1px solid #1e293b" }}>
                    {tip}
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          {/* Charts */}
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 4px" }}>River Health Index — 60 Day History</p>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={data.timeseries}>
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} width={25} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#1e293b", fontSize: 11, border: 'none' }} />
              <Line type="monotone" dataKey="rhi" stroke="#22c55e" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>

          <p style={{ fontSize: 11, color: "#94a3b8", margin: "12px 0 4px" }}>12-Week Forecast</p>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={data.forecast}>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 100]} width={25} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#1e293b", fontSize: 11, border: 'none' }} />
              <Line type="monotone" dataKey="rhi" stroke="#f59e0b" dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>

          {stress && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "12px 0 4px" }}>Stress Type Analysis</p>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={stress} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: "#1e293b", fontSize: 11, border: 'none' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stress.map((entry, i) => (
                      <Cell key={i} fill={entry.value > 60 ? "#ef4444" : entry.value > 30 ? "#f59e0b" : "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}