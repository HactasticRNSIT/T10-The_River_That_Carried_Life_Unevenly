import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const COLOR = { healthy: "#22c55e", at_risk: "#f59e0b", critical: "#ef4444" };

export default function RiverMap({ segments, onSelect }) {
  return (
    <MapContainer center={[22.0, 79.5]} zoom={6}
      style={{ flex: 1, minHeight: 400 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {segments.map(seg => (
        <CircleMarker key={seg.segment_id}
          center={[seg.lat, seg.lon]}
          radius={seg.is_anomaly ? 14 : 10}
          pathOptions={{ color: COLOR[seg.status], fillColor: COLOR[seg.status],
                         fillOpacity: 0.8, weight: seg.is_anomaly ? 3 : 1 }}
          eventHandlers={{ click: () => onSelect(seg.segment_id) }}>
          <Tooltip>
            <b>Segment {seg.segment_id}</b><br />
            RHI: {seg.rhi} | {seg.status.replace("_", " ").toUpperCase()}
            {seg.is_anomaly ? " ⚠️ ANOMALY" : ""}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}