# backend/feature_engineering.py
import pandas as pd
import numpy as np

def engineer_features(df):
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["segment_id", "date"]).reset_index(drop=True)

    for seg_id, group in df.groupby("segment_id"):
        idx = group.index

        # Rolling statistics (7-day and 30-day)
        for col in ["dissolved_oxygen", "nitrate_mgl", "turbidity_ntu", "water_temp_c"]:
            df.loc[idx, f"{col}_roll7"]  = group[col].rolling(7, min_periods=1).mean().values
            df.loc[idx, f"{col}_roll30"] = group[col].rolling(30, min_periods=1).mean().values
            df.loc[idx, f"{col}_lag7"]   = group[col].shift(7).values
            df.loc[idx, f"{col}_std7"]   = group[col].rolling(7, min_periods=1).std().values

    # Forward-fill biodiversity (monthly → daily)
    for col in ["fish_species", "macro_index", "spawning_events"]:
        df[col] = df.groupby("segment_id")[col].transform(lambda x: x.ffill())

    # Seasonal features
    df["day_of_year"] = df["date"].dt.dayofyear
    df["month"]       = df["date"].dt.month
    df["sin_season"]  = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["cos_season"]  = np.cos(2 * np.pi * df["day_of_year"] / 365)

    # Upstream pressure: propagate stress from upstream segments
    df["upstream_nitrate_avg"] = df.groupby("date")["nitrate_mgl"].transform(
        lambda x: x.shift(1).fillna(x.mean())
    )

    df = df.ffill().fillna(0)
    return df