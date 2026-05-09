import { useState, useEffect, useRef } from "react";
import RiverMap from "./components/RiverMap";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AlertFeed from "./components/AlertFeed";
import ExportReport from "./components/ExportReport";
import LocationSearch from "./components/LocationSearch";

const API = "http://127.0.0.1:8000";

const pulseStyle = `
  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0.8); opacity: 0.5; }
  }
`;

export default function App() {
  const [mapData, setMapData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [flyTo, setFlyTo] = useState(null);
  const [isLive, setIsLive] = useState(true);
  
  const [mapCenter, setMapCenter] = useState({ lat: 22.0, lon: 79.5 });
  const [readingCount, setReadingCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    const poll = () => {
      if (!isLive) return;
      fetch(`${API}/live-reading?lat=${mapCenter.lat}&lon=${mapCenter.lon}`)
        .then(r => r.json())
        .then(data => {
          setMapData(data);
          countRef.current += 1;
          setReadingCount(countRef.current);

          const newAlerts = data.filter(d => d.is_anomaly).map(d => ({
            date: new Date().toISOString().split("T")[0],
            segment_id: d.segment_id,
            rhi: d.rhi,
            do: d.dissolved_oxygen,
            nitrate: d.nitrate_mgl,
            anomaly_score: -0.3,
          }));

          if (newAlerts.length) {
            setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
          }
          setBackendStatus("ok");
        })
        .catch(() => setBackendStatus("offline"));
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [isLive, mapCenter]);

  if (backendStatus === "checking") {
    return <div style={{ height: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Connecting to River AI...</div>;
  }

  return (
    <>
      <style>{pulseStyle}</style>
      
      <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
        
        {/* SIDEBAR */}
        <div style={{ width: 320, display: "flex", flexDirection: "column", borderRight: "1px solid #1e293b" }}>
          
          {/* UPDATED HEADER SECTION */}
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #1e293b" }}>
            
            {/* Title row */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:15, fontWeight:700 }}>🌊 River AI Monitor</span>
              <button onClick={() => setIsLive(p => !p)}
                style={{ marginLeft:"auto", padding:"2px 10px", fontSize:10,
                  borderRadius:99, border:"none", cursor:"pointer",
                  background: isLive ? "#14532d" : "#1e293b",
                  color: isLive ? "#22c55e" : "#64748b",
                  display: "flex", alignItems: "center", gap: 4 }}>
                {isLive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse-ring 1.5s infinite" }}/>}
                {isLive ? "⏸ LIVE" : "▶ PAUSED"}
              </button>
            </div>

            {/* Stats row */}
            <div style={{ fontSize:11, color:"#64748b", marginBottom:12 }}>
              {mapData.filter(s => s.status === "critical").length} critical ·{" "}
              {mapData.filter(s => s.status === "at_risk").length} at risk ·{" "}
              Reading #{readingCount}
            </div>

            {/* Export PDF button */}
            <ExportReport mapData={mapData} alerts={alerts} />
          </div>

          {/* SIDEBAR CONTENT (Scrollable) */}
          <div style={{ padding: 16, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <LocationSearch onNavigate={loc => {
              setFlyTo(loc);
              setMapCenter({ lat: loc.lat, lon: loc.lon }); 
            }} />

            <div>
              <h3 style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", letterSpacing: 1, marginBottom: 12 }}>Recent Alerts</h3>
              <AlertFeed alerts={alerts} onSelect={id => {
                setSelected(id);
                const seg = mapData.find(s => s.segment_id === id);
                if(seg) {
                  setFlyTo({ lat: seg.lat, lon: seg.lon });
                  setMapCenter({ lat: seg.lat, lon: seg.lon });
                }
              }} />
            </div>
          </div>
        </div>

        {/* MAIN MAP AREA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          <RiverMap segments={mapData} onSelect={setSelected} flyTo={flyTo} />
          
          {selected !== null && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000, maxHeight: "55%", overflowY: "auto", background: "#0f172a", borderTop: "2px solid #334155" }}>
              <AnalyticsPanel segmentId={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>

      </div>
    </>
  );
}