import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPanel({ segmentId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(null);
    setError(null);
    setLoading(true);

    fetch(`http://127.0.0.1:8000/segment/${segmentId}?days=60`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        console.log("✅ Segment data:", json); // check browser console
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [segmentId]);

  return (
    <div style={{ height: 300, background: "#1e293b", padding: 16, borderTop: "2px solid #334155" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: "#e2e8f0" }}>
          📍 Segment {segmentId} Analysis
        </h2>
        <button onClick={onClose} style={{ background: "none", border: "none",
          color: "#94a3b8", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", paddingTop: 40 }}>
          ⏳ Loading segment {segmentId} data...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ color: "#f87171", fontSize: 13, padding: 12,
          background: "#450a0a", borderRadius: 6 }}>
          ❌ Error: {error}
        </div>
      )}

      {/* Data */}
      {data && !loading && (
        <>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            {[
              { label: "Data points", value: data.timeseries?.length ?? 0 },
              { label: "Forecast weeks", value: data.forecast?.length ?? 0 },
              { label: "Latest RHI", value: data.timeseries?.slice(-1)[0]?.rhi?.toFixed(1) ?? "N/A" },
              { label: "Segment", value: data.segment_id },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "#0f172a", borderRadius: 6,
                padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#38bdf8" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* RHI Chart */}
          {data.timeseries?.length > 0 ? (
            <>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 4px" }}>
                River Health Index — last 60 days
              </p>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={data.timeseries}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 100]} width={28} tick={{ fontSize: 9, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "none", fontSize: 11 }}
                    formatter={(v) => [v?.toFixed(1), "RHI"]}
                  />
                  <Line type="monotone" dataKey="rhi" stroke="#22c55e"
                    dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p style={{ color: "#f59e0b", fontSize: 12 }}>⚠️ No timeseries data returned</p>
          )}

          {/* Forecast Chart */}
          {data.forecast?.length > 0 ? (
            <>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "8px 0 4px" }}>
                12-week forecast
              </p>
              <ResponsiveContainer width="100%" height={70}>
                <LineChart data={data.forecast}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} width={28} tick={{ fontSize: 9, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "none", fontSize: 11 }}
                    formatter={(v) => [v?.toFixed(1), "Forecast RHI"]}
                  />
                  <Line type="monotone" dataKey="rhi" stroke="#f59e0b"
                    dot={false} strokeWidth={2} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p style={{ color: "#f59e0b", fontSize: 12 }}>⚠️ No forecast data returned</p>
          )}
        </>
      )}
    </div>
  );
}