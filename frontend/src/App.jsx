// frontend/src/App.jsx
import { useState, useEffect } from "react";
import RiverMap from "./components/RiverMap";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AlertFeed from "./components/AlertFeed";

const API ="http://127.0.0.1:8000";

export default function App() {
  const [mapData, setMapData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => {
        setBackendStatus("ok");
        fetch(`${API}/map-data`).then(r => r.json()).then(setMapData).catch(console.error);
        fetch(`${API}/alerts`).then(r => r.json()).then(setAlerts).catch(console.error);
      })
      .catch(() => setBackendStatus("offline"));
  }, []);

  if (backendStatus === "checking") {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
        height:"100vh", background:"#0f172a", color:"#94a3b8", fontSize:16 }}>
        Connecting to backend...
      </div>
    );
  }

  if (backendStatus === "offline") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", height:"100vh", background:"#0f172a", color:"#f87171" }}>
        <h2>⚠️ Backend Offline</h2>
        <p style={{ color:"#94a3b8" }}>Make sure FastAPI is running on port 8000</p>
        <code style={{ background:"#1e293b", padding:"8px 16px", borderRadius:6,
          color:"#67e8f9", marginTop:8 }}>
          cd backend && python -m uvicorn main:app --reload --port 8000
        </code>
        <button onClick={() => window.location.reload()}
          style={{ marginTop:16, padding:"8px 20px", background:"#1d4ed8",
            color:"white", border:"none", borderRadius:6, cursor:"pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0f172a", color:"#e2e8f0" }}>
      <div style={{ width:320, padding:16, overflowY:"auto", borderRight:"1px solid #1e293b" }}>
        <h1 style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>🌊 River AI Monitor</h1>
        <p style={{ fontSize:12, color:"#94a3b8", marginBottom:16 }}>
          {mapData.filter(s => s.status === "critical").length} critical segments detected
        </p>
        <AlertFeed alerts={alerts} onSelect={id => setSelected(id)} />
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <RiverMap segments={mapData} onSelect={setSelected} />
        {selected !== null && (
          <AnalyticsPanel segmentId={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}