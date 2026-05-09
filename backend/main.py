# backend/main.py
import random
from datetime import datetime
import pandas as pd, numpy as np, json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from feature_engineering import engineer_features
from models.health_index import compute_river_health_index
from models.anomaly import train_anomaly_model, load_and_predict
from models.stress_classifier import train_stress_model, predict_stress
from models.forecaster import train_forecast_model, forecast_segment
import data_generator

app = FastAPI(title="River Ecosystem AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # allow ALL origins
    allow_credentials=False,       # must be False when using *
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup: load & train ──────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    global df
    try:
        df = pd.read_csv("data/river_data.csv")
    except FileNotFoundError:
        df = data_generator.generate_all_data()

    df = engineer_features(df)

    # Compute RHI for every row
    rhi_results = df.apply(lambda r: compute_river_health_index(r)[0], axis=1)
    df["rhi"] = rhi_results

    # Train all models
    df, _ = train_anomaly_model(df)
    train_stress_model(df)
    train_forecast_model(df)
    print("✅ All models trained and ready")

# ── Routes ─────────────────────────────────────────────────────────────────
@app.get("/health")
def get_system_health():
    return {"status": "ok", "segments": 20, "rows": len(df)}

@app.get("/live-reading")
def get_live_reading(lat: float = 22.0, lon: float = 79.5):
    """Generates live readings — dots spread around given lat/lon."""
    readings = []
    for seg in range(20):
        stressed = seg in [5, 6, 13, 14]

        base_do  = random.uniform(2.5, 4.5)  if stressed else random.uniform(6.5, 9.5)
        base_no3 = random.uniform(8.0, 13.0) if stressed else random.uniform(1.5, 4.0)
        base_tur = random.uniform(18, 35)     if stressed else random.uniform(3, 12)
        base_tmp = random.uniform(20, 26)     if stressed else random.uniform(14, 20)

        do_score  = max(0, min(100, (base_do - 2)   / 8   * 100))
        no3_score = max(0, min(100, (10 - base_no3) / 10  * 100))
        tur_score = max(0, min(100, (50 - base_tur) / 50  * 100))
        live_rhi  = round(do_score*0.35 + no3_score*0.30 + tur_score*0.20 + 15, 1)
        live_rhi  = max(0, min(100, live_rhi))

        readings.append({
            "segment_id":       seg,
            "timestamp":        datetime.now().strftime("%H:%M:%S"),
            "dissolved_oxygen": round(base_do,  2),
            "nitrate_mgl":      round(base_no3, 2),
            "turbidity_ntu":    round(base_tur, 2),
            "water_temp_c":     round(base_tmp, 2),
            "rhi":              live_rhi,
            "status": "critical" if live_rhi < 35 else "at_risk" if live_rhi < 60 else "healthy",
            "is_anomaly": 1 if stressed else 0,
            # ← Spread dots around the searched lat/lon
            "lat": lat + (seg - 10) * 0.06,
            "lon": lon + (seg - 10) * 0.09,
        })
    return readings

@app.get("/map-data")
def get_map_data():
    """Latest RHI and anomaly flag per segment for map rendering."""
    latest = df.groupby("segment_id").last().reset_index()
    result = []
    for _, row in latest.iterrows():
        rhi, sub_scores = compute_river_health_index(row)
        result.append({
            "segment_id": int(row["segment_id"]),
            "rhi": rhi,
            "is_anomaly": int(row.get("is_anomaly", 0)),
            "anomaly_score": round(float(row.get("anomaly_score", 0)), 3),
            "status": "critical" if rhi < 35 else "at_risk" if rhi < 60 else "healthy",
            "sub_scores": sub_scores,
            "lat": 20.5 + row["segment_id"] * 0.08,
            "lon": 78.0 + row["segment_id"] * 0.12,
        })
    return result

@app.get("/segment/{segment_id}")
def get_segment_detail(segment_id: int, days: int = 60):
    try:
        seg_df = df[df["segment_id"] == segment_id].copy()
        
        if seg_df.empty:
            return {"error": f"Segment {segment_id} not found", "segment_id": segment_id}
        
        seg_df = seg_df.tail(days)
        
        ts_cols = ["date", "dissolved_oxygen", "nitrate_mgl",
                   "turbidity_ntu", "water_temp_c", "rhi", "is_anomaly"]
        
        if "fish_species" in seg_df.columns:
            ts_cols.append("fish_species")
        
        ts = seg_df[ts_cols].copy()
        ts["date"] = ts["date"].astype(str)
        ts = ts.where(ts.notna(), other=None)
        
        timeseries = ts.to_dict("records")
        
        try:
            forecast = forecast_segment(seg_df, n_weeks=12)
        except Exception as e:
            print(f"Forecast error: {e}")
            last_rhi = float(seg_df["rhi"].iloc[-1]) if "rhi" in seg_df.columns else 50.0
            forecast = [{"week": w, "rhi": round(last_rhi + (w * -0.3), 1)} for w in range(1, 13)]
        
        return {
            "segment_id": segment_id,
            "timeseries": timeseries,
            "forecast": forecast,
        }
    except Exception as e:
        return {"error": str(e), "segment_id": segment_id, "timeseries": [], "forecast": []}

@app.get("/alerts")
def get_alerts():
    anomalies = df[df["is_anomaly"] == 1].tail(50)
    alerts = []
    for _, row in anomalies.iterrows():
        alerts.append({
            "date": str(row["date"]),
            "segment_id": int(row["segment_id"]),
            "anomaly_score": round(float(row["anomaly_score"]), 3),
            "rhi": round(float(row["rhi"]), 1),
            "do": row["dissolved_oxygen"],
            "nitrate": row["nitrate_mgl"],
        })
    return sorted(alerts, key=lambda x: x["anomaly_score"])

@app.get("/stress/{segment_id}")
def get_stress_types(segment_id: int):
    seg_df = df[df["segment_id"] == segment_id].tail(30)
    stress_df = predict_stress(seg_df)
    return stress_df.mean().round(3).to_dict()

@app.get("/vulnerability")
def get_vulnerability():
    latest = df.groupby("segment_id").last().reset_index()
    results = []
    for _, row in latest.iterrows():
        rhi, _ = compute_river_health_index(row)
        vuln = round(100 - rhi, 1)
        results.append({
            "segment_id": int(row["segment_id"]),
            "vulnerability_score": vuln,
            "risk_level": "high" if vuln > 65 else "medium" if vuln > 40 else "low"
        })
    return sorted(results, key=lambda x: -x["vulnerability_score"])