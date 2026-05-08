# backend/data_generator.py
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)
N_SEGMENTS = 20
N_DAYS = 730  # 2 years
START = datetime(2022, 1, 1)
STRESS_SEGS = [5, 6, 13, 14]  # segments with injected problems
STRESS_DAY = 400

def seasonal(n, amp=1.0, phase=0.0):
    t = np.arange(n)
    return amp * np.sin(2 * np.pi * t / 365 + phase)

def generate_all_data():
    dates = [START + timedelta(days=i) for i in range(N_DAYS)]
    records = []

    for seg in range(N_SEGMENTS):
        for day in range(N_DAYS):
            stressed = (seg in STRESS_SEGS) and (day >= STRESS_DAY)
            sf = np.random.uniform(0.5, 0.75) if stressed else 1.0

            records.append({
                "date": dates[day].strftime("%Y-%m-%d"),
                "segment_id": seg,
                # Water quality
                "dissolved_oxygen": round(max(1, (8.5 - seg*0.1 + seasonal(N_DAYS,1.2,np.pi)[day] + np.random.normal(0,0.3)) * sf), 2),
                "ph":              round(np.clip(7.2 + seasonal(N_DAYS,0.15)[day] + np.random.normal(0,0.05), 5.5, 9.0), 2),
                "nitrate_mgl":     round(max(0, (2+seg*0.3 + seasonal(N_DAYS,1.5,-np.pi/2)[day] + np.random.normal(0,0.4)) * (2.0 if stressed else 1.0)), 2),
                "turbidity_ntu":   round(max(0, 5 + seg*1.2 + np.random.exponential(3) + (10 if stressed else 0)), 2),
                "water_temp_c":    round(15 + seasonal(N_DAYS,8)[day] + np.random.normal(0,0.5), 2),
                # Biodiversity (monthly surveys — fill others with NaN)
                "fish_species":    int(max(1, (18-seg*0.4 + seasonal(N_DAYS,3)[day] + np.random.normal(0,1.5)) * sf)) if day % 30 == 0 else np.nan,
                "macro_index":     round(max(0, (8-seg*0.2+np.random.normal(0,0.8)) * sf), 2) if day % 30 == 0 else np.nan,
                "spawning_events": int(max(0, np.random.poisson(5 if not stressed else 1))) if day % 30 == 0 else np.nan,
                # Hydrology
                "flow_rate_cms":   round(max(1, 120-seg*2 + seasonal(N_DAYS,40)[day] + np.random.exponential(8)), 2),
                "sediment_load":   round(max(0, 15+seg*0.8 + np.random.exponential(5) + (20 if stressed else 0)), 2),
            })

    df = pd.DataFrame(records)
    df.to_csv("data/river_data.csv", index=False)
    print(f"Generated {len(df)} rows across {N_SEGMENTS} segments")
    return df

if __name__ == "__main__":
    import os; os.makedirs("data", exist_ok=True)
    generate_all_data()