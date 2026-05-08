// frontend/src/components/AlertFeed.jsx
export default function AlertFeed({ alerts, onSelect }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>RECENT ANOMALIES</p>
      {alerts.slice(0, 15).map((a, i) => (
        <div key={i} onClick={() => onSelect(a.segment_id)}
          style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 6, cursor: "pointer",
            background: a.rhi < 35 ? "#450a0a" : "#422006",
            border: `1px solid ${a.rhi < 35 ? "#7f1d1d" : "#78350f"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Segment {a.segment_id}</span>
            <span style={{ fontSize: 11, color: a.rhi < 35 ? "#f87171" : "#fbbf24" }}>
              RHI {a.rhi}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {a.date} · DO: {a.do} mg/L · NO₃: {a.nitrate} mg/L
          </div>
        </div>
      ))}
    </div>
  );
}