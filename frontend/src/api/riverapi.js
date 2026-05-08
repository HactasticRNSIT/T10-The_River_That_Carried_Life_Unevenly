const API = "http://127.0.0.1:8000";

export const fetchMapData   = () => fetch(`${API}/map-data`).then(r => r.json());
export const fetchAlerts    = () => fetch(`${API}/alerts`).then(r => r.json());
export const fetchSegment   = (id, days=60) => fetch(`${API}/segment/${id}?days=${days}`).then(r => r.json());
export const fetchStress    = (id) => fetch(`${API}/stress/${id}`).then(r => r.json());
export const fetchVulnerability = () => fetch(`${API}/vulnerability`).then(r => r.json());