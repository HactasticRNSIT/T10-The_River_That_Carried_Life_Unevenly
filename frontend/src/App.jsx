import { useState, useEffect } from "react";
import RiverMap from "./components/RiverMap";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AlertFeed from "./components/AlertFeed";

export default function App() {
  const [mapData, setMapData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/map-data").then(r => r.json()).then(setMapData);
    fetch("http://localhost:8000/alerts").then(r => r.json()).then(setAlerts);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Sidebar */}
      <div style={{ width: 320, padding: 16, overflowY: "auto", borderRight: "1px solid #1e293b" }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🌊 River AI Monitor</h1>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
          {mapData.filter(s => s.status === "critical").length} critical segments detected
        </p>
        <AlertFeed alerts={alerts} onSelect={id => setSelected(id)} />
      </div>

      {/* Map + Analytics */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <RiverMap segments={mapData} onSelect={setSelected} />
        {selected !== null && (
          <AnalyticsPanel segmentId={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}