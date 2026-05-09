# T10-The_River_That_Carried_Life_Unevenly
# 🌊 River Ecosystem AI: Real-Time Monitoring & Predictive Analytics

An end-to-end AI platform designed to monitor river health, detect pollution anomalies using unsupervised learning, and forecast ecosystem trends. This project integrates multiple machine learning models to provide actionable insights for conservation officers and environmental researchers.

## 🚀 Key Features
* **Geospatial Health Mapping**: Interactive Leaflet.js map with color-coded segments based on the **River Health Index (RHI)**.
* **Anomaly Detection**: Uses **Isolation Forest** (Unsupervised Learning) to identify statistically unusual water quality readings without prior labeling.
* **Multi-Label Stress Classification**: A **Random Forest** model that diagnoses the *type* of stress (e.g., Agricultural Runoff, Thermal Stress, or Oxygen Depletion).
* **Health Forecasting**: **XGBoost Regression** predicts the future RHI trajectory for the next 12 weeks based on seasonal and historical trends.
* **Automated Feature Engineering**: Advanced data pipeline creating rolling averages, lag features, and seasonal encoding (Sine/Cosine) for 25+ features.

---

## 🧠 The AI Engine

The system processes **14,600+ rows** of time-series data across four specialized models:

| Model | Type | Purpose |
| :--- | :--- | :--- |
| **Isolation Forest** | Unsupervised | Detects pollution spikes and sensor anomalies. |
| **Weighted Scorer** | Rule-Based | Computes the **River Health Index (RHI)** (0-100). |
| **Random Forest** | Classification | Identifies stress sources (Thermal, Chemical, etc.). |
| **XGBoost** | Regression | Forecasts health trends for proactive conservation. |

---

## 🛠️ Tech Stack

### **Backend**
* **FastAPI**: High-performance Python API framework.
* **Scikit-Learn / XGBoost**: For model training and inference.
* **Pandas/NumPy**: For advanced feature engineering and data manipulation.

### **Frontend**
* **React (Vite)**: Modern frontend framework for a responsive, dark-mode dashboard.
* **Leaflet.js**: Geospatial visualization of river segments using OpenStreetMap.
* **Recharts**: Interactive time-series charts for RHI trends and predictive forecasting.

---

## 📂 Project Structure
```text
T10-The_River_That_Carried_Life_Unevenly/
├── backend/
│   ├── main.py              # FastAPI Routes & App Startup
│   ├── data_generator.py    # Synthetic Time-Series Generation Logic
│   ├── feature_engineering.py # Rolling averages & Seasonal encoding
│   └── models/
│       ├── health_index.py  # Weighted RHI Logic
│       ├── anomaly.py       # Isolation Forest Implementation
│       ├── stress.py        # Random Forest Stress Classifier
│       └── forecaster.py    # XGBoost Health Predictor
├── frontend/
│   ├── src/
│   │   ├── components/      # RiverMap, AlertFeed, AnalyticsPanel
│   │   └── App.jsx          # Main Dashboard & Data Fetching Logic
└── data/
    └── river_data.csv       # Generated Dataset (14k+ records)
