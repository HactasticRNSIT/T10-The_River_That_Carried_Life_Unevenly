# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd, numpy as np, json

from feature_engineering import engineer_features
from models.health_index import compute_river_health_index
from models.anomaly import train_anomaly_model, load_and_predict
from models.stress_classifier import train_stress_model, predict_stress
from models.forecaster import train_forecast_model, forecast_segment
import data_generator

app = FastAPI(title="River Ecosystem AI API")

app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

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
            # Simulated lat/lon along a river path (replace with real GeoJSON)
            "lat": 20.5 + row["segment_id"] * 0.08,
            "lon": 78.0 + row["segment_id"] * 0.12,
        })
    return result

@app.get("/segment/{segment_id}")
def get_segment_detail(segment_id: int, days: int = 90):
    seg_df = df[df["segment_id"] == segment_id].tail(days)
    return {
        "segment_id": segment_id,
        "timeseries": seg_df[["date","dissolved_oxygen","nitrate_mgl",
                               "turbidity_ntu","water_temp_c","rhi",
                               "is_anomaly","fish_species"]].to_dict("records"),
        "forecast": forecast_segment(seg_df, n_weeks=12),
    }

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