import xgboost as xgb
import pandas as pd, numpy as np, joblib

FORECAST_FEATURES = ["dissolved_oxygen_roll7", "nitrate_mgl_roll30",
                     "turbidity_ntu_roll7", "water_temp_c_roll7",
                     "fish_species", "macro_index", "sediment_load",
                     "sin_season", "cos_season", "segment_id"]

def train_forecast_model(df):
    df = df.dropna(subset=FORECAST_FEATURES + ["rhi"])
    X = df[FORECAST_FEATURES]
    y = df["rhi"]
    model = xgb.XGBRegressor(n_estimators=200, max_depth=5,
                              learning_rate=0.05, random_state=42)
    model.fit(X, y)
    joblib.dump(model, "data/forecast_model.pkl")
    return model

def forecast_segment(segment_df, n_weeks=12):
    model = joblib.load("data/forecast_model.pkl")
    last = segment_df.iloc[-1].copy()
    forecasts = []
    for week in range(1, n_weeks + 1):
        row = last[FORECAST_FEATURES].fillna(0).to_frame().T
        pred_rhi = float(model.predict(row)[0])
        pred_rhi = np.clip(pred_rhi + np.random.normal(0, 1.5), 0, 100)
        forecasts.append({"week": week, "rhi": round(pred_rhi, 1)})
        last["dissolved_oxygen_roll7"] *= 0.99  # simulate slight drift
    return forecasts