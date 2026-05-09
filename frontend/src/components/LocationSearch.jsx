import { useState } from "react";

export default function LocationSearch({ onNavigate }) {
  const [lat, setLat]       = useState("");
  const [lon, setLon]       = useState("");
  const [name, setName]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Preset real Indian rivers
  const PRESETS = [
    { name: "Ganga — Varanasi",    lat: 25.3176, lon: 82.9739 },
    { name: "Yamuna — Delhi",      lat: 28.6139, lon: 77.2090 },
    { name: "Godavari — Nashik",   lat: 19.9975, lon: 73.7898 },
    { name: "Krishna — Vijayawada",lat: 16.5062, lon: 80.6480 },
    { name: "Narmada — Jabalpur",  lat: 23.1815, lon: 79.9864 },
    { name: "Brahmaputra — Guwahati", lat: 26.1445, lon: 91.7362 },
    { name: "Cauvery — Mysuru",    lat: 12.2958, lon: 76.6394 },
    { name: "Wardha — Nagpur",     lat: 21.1458, lon: 79.0882 },
  ];

  const handleGo = () => {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      setError("Enter valid latitude and longitude numbers");
      return;
    }
    if (parsedLat < -90 || parsedLat > 90) {
      setError("Latitude must be between -90 and 90");
      return;
    }
    if (parsedLon < -180 || parsedLon > 180) {
      setError("Longitude must be between -180 and 180");
      return;
    }

    setError("");
    setLoading(true);

    // Simulate fetching river data for this location
    setTimeout(() => {
      setLoading(false);
      onNavigate({ lat: parsedLat, lon: parsedLon, name: name || `${parsedLat}, ${parsedLon}` });
    }, 800);
  };

  const handlePreset = (p) => {
    setLat(String(p.lat));
    setLon(String(p.lon));
    setName(p.name);
    setError("");
    onNavigate({ lat: p.lat, lon: p.lon, name: p.name });
  };

  return (
    <div style={{ padding: "10px 12px", borderBottom: "1px solid #1e293b",
      background: "#0a0f1a" }}>

      <div style={{ fontSize: 10, color: "#475569", marginBottom: 6, letterSpacing: 1 }}>
        📍 NAVIGATE TO RIVER LOCATION
      </div>

      {/* Lat/Lon inputs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input
          type="number" placeholder="Latitude"
          value={lat} onChange={e => setLat(e.target.value)}
          style={{ flex: 1, padding: "5px 8px", fontSize: 11,
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 5, color: "#e2e8f0", outline: "none" }}
        />
        <input
          type="number" placeholder="Longitude"
          value={lon} onChange={e => setLon(e.target.value)}
          style={{ flex: 1, padding: "5px 8px", fontSize: 11,
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 5, color: "#e2e8f0", outline: "none" }}
        />
        <button onClick={handleGo}
          disabled={loading}
          style={{ padding: "5px 12px", fontSize: 11, borderRadius: 5,
            border: "none", background: "#1d4ed8", color: "white",
            cursor: "pointer", fontWeight: 600, minWidth: 44 }}>
          {loading ? "..." : "Go"}
        </button>
      </div>

      {/* Optional name */}
      <input
        placeholder="Location name (optional)"
        value={name} onChange={e => setName(e.target.value)}
        style={{ width: "100%", padding: "5px 8px", fontSize: 11,
          background: "#1e293b", border: "1px solid #334155",
          borderRadius: 5, color: "#e2e8f0", outline: "none",
          marginBottom: 6, boxSizing: "border-box" }}
      />

      {/* Error */}
      {error && (
        <div style={{ fontSize: 10, color: "#f87171", marginBottom: 6 }}>
          ⚠ {error}
        </div>
      )}

      {/* Preset rivers */}
      <div style={{ fontSize: 9, color: "#475569", marginBottom: 4 }}>
        QUICK SELECT — INDIAN RIVERS
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => handlePreset(p)}
            style={{ padding: "3px 7px", fontSize: 9, borderRadius: 4,
              border: "1px solid #334155", background: "#1e293b",
              color: "#94a3b8", cursor: "pointer",
              transition: "all 0.15s" }}
            onMouseEnter={e => {
              e.target.style.background = "#1d4ed8";
              e.target.style.color = "white";
            }}
            onMouseLeave={e => {
              e.target.style.background = "#1e293b";
              e.target.style.color = "#94a3b8";
            }}>
            {p.name.split("—")[0].trim()}
          </button>
        ))}
      </div>
    </div>
  );
}