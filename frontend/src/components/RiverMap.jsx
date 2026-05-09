import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Health status color palette
const COLOR = {
  healthy: "#22c55e",
  at_risk: "#f59e0b",
  critical: "#ef4444"
};

/**
 * Helper component to programmatically move the map view.
 * It listens for changes to the 'center' prop and uses map.flyTo for a smooth transition.
 */
function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lon) {
      map.flyTo([center.lat, center.lon], 8, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function RiverMap({ segments, onSelect, flyTo }) {
  // Sort and format the path for the river line
  const riverPath = [...segments]
    .sort((a, b) => a.segment_id - b.segment_id)
    .map(s => [s.lat, s.lon]);

  return (
    <div style={{ height: "100%", width: "100%", minHeight: 400, borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer 
        center={[22.0, 79.5]} 
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        {/* 1. Satellite Base Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />

        {/* 2. Map Animation Controller */}
        {flyTo && <FlyTo center={flyTo} />}

        {/* 3. River Path (Dashed Line) */}
        {riverPath.length > 1 && (
          <Polyline
            positions={riverPath}
            pathOptions={{ 
              color: "#38bdf8", 
              weight: 3, 
              opacity: 0.6, 
              dashArray: "6 4" 
            }}
          />
        )}

        {/* 4. Interactive Segment Markers */}
        {segments.map(seg => (
          <CircleMarker 
            key={seg.segment_id}
            center={[seg.lat, seg.lon]}
            radius={seg.is_anomaly ? 14 : 9}
            pathOptions={{
              color: seg.is_anomaly ? "#fff" : COLOR[seg.status], 
              fillColor: COLOR[seg.status],
              fillOpacity: 0.85,
              weight: seg.is_anomaly ? 3 : 1
            }}
            eventHandlers={{ 
              click: () => onSelect(seg.segment_id) 
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div style={{ padding: "2px" }}>
                <b>Segment {seg.segment_id}</b><br />
                <span>RHI: <strong>{seg.rhi}</strong></span><br />
                <span style={{ color: COLOR[seg.status], fontWeight: "bold" }}>
                  {seg.status.replace("_", " ").toUpperCase()}
                </span>
                {seg.is_anomaly && <span style={{ color: "#ef4444" }}> ⚠️ ANOMALY</span>}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}