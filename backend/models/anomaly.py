from sklearn.ensemble import IsolationForest
import pandas as pd, joblib, os

FEATURES = ["dissolved_oxygen", "nitrate_mgl", "turbidity_ntu",
            "water_temp_c", "ph", "sediment_load",
            "dissolved_oxygen_roll7", "nitrate_mgl_roll7"]

def train_anomaly_model(df):
    X = df[FEATURES].fillna(0)
    model = IsolationForest(contamination=0.08, random_state=42, n_estimators=150)
    model.fit(X)
    joblib.dump(model, "data/anomaly_model.pkl")
    # Score: -1 = anomaly, 1 = normal → convert to 0/1
    df["anomaly_score"] = model.decision_function(X)
    df["is_anomaly"]    = (model.predict(X) == -1).astype(int)
    return df, model

def load_and_predict(df):
    model = joblib.load("data/anomaly_model.pkl")
    X = df[FEATURES].fillna(0)
    df["anomaly_score"] = model.decision_function(X)
    df["is_anomaly"]    = (model.predict(X) == -1).astype(int)
    return df