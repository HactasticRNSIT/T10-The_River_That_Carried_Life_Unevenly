import numpy as np

def compute_river_health_index(row):
    """
    Interpretable weighted scoring — no black box.
    Returns 0 (critical) to 100 (excellent).
    """
    scores = {}

    # Dissolved Oxygen score (critical below 5 mg/L)
    do = row.get("dissolved_oxygen", 7)
    scores["do"] = np.clip((do - 2) / (10 - 2) * 100, 0, 100)

    # Nitrate score (bad above 10 mg/L)
    nit = row.get("nitrate_mgl", 2)
    scores["nitrate"] = np.clip((10 - nit) / 10 * 100, 0, 100)

    # Turbidity score (bad above 50 NTU)
    tur = row.get("turbidity_ntu", 5)
    scores["turbidity"] = np.clip((50 - tur) / 50 * 100, 0, 100)

    # pH score (ideal 6.5–8.5)
    ph = row.get("ph", 7.2)
    ph_dev = abs(ph - 7.5)
    scores["ph"] = np.clip((1 - ph_dev / 2.5) * 100, 0, 100)

    # Biodiversity score
    fish = row.get("fish_species", 10)
    scores["biodiversity"] = np.clip(fish / 20 * 100, 0, 100)

    # Weighted composite
    weights = {"do": 0.30, "nitrate": 0.25, "turbidity": 0.15,
               "ph": 0.10, "biodiversity": 0.20}

    rhi = sum(weights[k] * scores[k] for k in weights)
    return round(rhi, 1), scores
