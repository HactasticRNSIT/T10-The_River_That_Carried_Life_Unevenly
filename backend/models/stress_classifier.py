from sklearn.ensemble import RandomForestClassifier
import numpy as np, joblib
import pandas as pd

STRESS_FEATURES = ["dissolved_oxygen_roll7", "nitrate_mgl_roll7",
                   "turbidity_ntu", "sediment_load", "water_temp_c",
                   "sin_season", "cos_season", "upstream_nitrate_avg"]

STRESS_TYPES = ["pollution", "agricultural_runoff", "thermal_stress",
                "sediment_overload", "oxygen_depletion"]

def generate_stress_labels(df):
    """Rule-based label generation for training."""
    labels = np.zeros((len(df), len(STRESS_TYPES)), dtype=int)
    labels[:, 0] = ((df["nitrate_mgl"] > 5) & (df["turbidity_ntu"] > 20)).astype(int)
    labels[:, 1] = (df["nitrate_mgl_roll7"] > 4).astype(int)
    labels[:, 2] = (df["water_temp_c"] > 22).astype(int)
    labels[:, 3] = (df["sediment_load"] > 25).astype(int)
    labels[:, 4] = (df["dissolved_oxygen"] < 5).astype(int)
    return labels

def train_stress_model(df):
    X = df[STRESS_FEATURES].fillna(0)
    y = generate_stress_labels(df)
    models = {}
    for i, stress in enumerate(STRESS_TYPES):
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X, y[:, i])
        models[stress] = clf
    joblib.dump(models, "data/stress_models.pkl")
    return models

def predict_stress(df):
    models = joblib.load("data/stress_models.pkl")
    X = df[STRESS_FEATURES].fillna(0)
    results = {}
    for stress, model in models.items():
        results[stress] = model.predict_proba(X)[:, 1]
    return pd.DataFrame(results, index=df.index)