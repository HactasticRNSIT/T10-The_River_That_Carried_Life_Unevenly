import jsPDF from "jspdf";

export default function ExportReport({ mapData, alerts }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    // ── Header ──────────────────────────────────────────────
    doc.setFillColor(10, 15, 26);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(56, 189, 248);        // ← separate R,G,B — NOT array
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("River AI Monitor", 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Ecosystem Health Report — AI-Powered Analysis", 14, 26);
    doc.text(`Generated: ${now}`, 14, 33);

    // ── KPI Summary ─────────────────────────────────────────
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 44, 210, 32, "F");

    const critical = mapData.filter(s => s.status === "critical").length;
    const atRisk   = mapData.filter(s => s.status === "at_risk").length;
    const healthy  = mapData.filter(s => s.status === "healthy").length;
    const avgRhi   = mapData.length
      ? (mapData.reduce((a, b) => a + b.rhi, 0) / mapData.length).toFixed(1)
      : "N/A";

    // KPI values with correct setTextColor calls
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");

    doc.setTextColor(56, 189, 248);
    doc.text(String(mapData.length), 14, 62);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Total Segments", 14, 70);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(String(critical), 60, 62);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Critical", 60, 70);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11);
    doc.text(String(atRisk), 106, 62);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("At Risk", 106, 70);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text(String(healthy), 152, 62);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Healthy", 152, 70);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(167, 139, 250);
    doc.text(String(avgRhi), 180, 62);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Avg RHI", 180, 70);

    // ── Segment Table ────────────────────────────────────────
    let y = 88;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(226, 232, 240);
    doc.text("Segment Health Summary", 14, y);
    y += 6;

    // Table header bg
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 182, 8, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("SEG",      18,  y + 5.5);
    doc.text("RHI",      40,  y + 5.5);
    doc.text("STATUS",   65,  y + 5.5);
    doc.text("DO mg/L",  105, y + 5.5);
    doc.text("NO3 mg/L", 140, y + 5.5);
    doc.text("ANOMALY",  175, y + 5.5);
    y += 10;

    // Table rows
    const sorted = [...mapData].sort((a, b) => a.rhi - b.rhi);
    sorted.forEach((seg, i) => {
      if (y > 270) { doc.addPage(); y = 20; }

      if (i % 2 === 0) {
        doc.setFillColor(22, 32, 48);
        doc.rect(14, y - 4, 182, 8, "F");
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text(String(seg.segment_id), 18, y + 0.5);

      // RHI colored
      if (seg.status === "critical")    doc.setTextColor(239, 68, 68);
      else if (seg.status === "at_risk") doc.setTextColor(245, 158, 11);
      else                               doc.setTextColor(34, 197, 94);
      doc.text(String(seg.rhi), 40, y + 0.5);

      doc.setTextColor(226, 232, 240);
      doc.text(seg.status.replace("_", " ").toUpperCase(), 65, y + 0.5);
      doc.text(String(seg.dissolved_oxygen ?? "N/A"), 105, y + 0.5);
      doc.text(String(seg.nitrate_mgl     ?? "N/A"), 140, y + 0.5);

      if (seg.is_anomaly) doc.setTextColor(239, 68, 68);
      else                doc.setTextColor(34, 197, 94);
      doc.text(seg.is_anomaly ? "YES" : "NO", 175, y + 0.5);

      y += 8;
    });

    // ── Recent Alerts ────────────────────────────────────────
    if (alerts.length > 0) {
      y += 8;
      if (y > 250) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(226, 232, 240);
      doc.text("Recent Anomaly Alerts", 14, y);
      y += 8;

      alerts.slice(0, 10).forEach(a => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(251, 191, 36);
        doc.text(
          `Segment ${a.segment_id} | ${a.date} | RHI: ${a.rhi} | DO: ${a.do} mg/L | NO3: ${a.nitrate} mg/L`,
          14, y
        );
        y += 7;
      });
    }

    // ── Footer ───────────────────────────────────────────────
    doc.setFillColor(10, 15, 26);
    doc.rect(0, 285, 210, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text("Generated by River AI Monitor | AI-Powered Ecosystem Health System", 14, 292);
    doc.text(now, 162, 292);

    doc.save(`river-health-report-${Date.now()}.pdf`);
  };

  return (
    <button onClick={generatePDF}
      style={{ padding: "6px 14px", fontSize: 11, borderRadius: 6,
        border: "none", background: "#1d4ed8", color: "white",
        cursor: "pointer", fontWeight: 600, display: "flex",
        alignItems: "center", gap: 6 }}>
      📤 Export PDF
    </button>
  );
}