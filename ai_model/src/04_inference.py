import json
import subprocess
import sys

import joblib
import pandas as pd


BASE = "models"


# --------------------------------
# Load artifacts
# --------------------------------

preprocess = joblib.load(
    f"{BASE}/preprocess.joblib"
)

risk_model = joblib.load(
    f"{BASE}/risk_best.joblib"
)

cost_model = joblib.load(
    f"{BASE}/cost_regressor.joblib"
)

anomaly_artifact = joblib.load(
    f"{BASE}/anomaly_iforest.joblib"
)

knn_artifact = joblib.load(
    f"{BASE}/similarity_knn.joblib"
)

shap_importance = pd.read_csv(
    f"{BASE}/shap_importance.csv"
)


FEATURES = preprocess["features"]
CAT_MAPS = preprocess["cat_maps"]
NUM_COLS = preprocess["num_cols"]
CAT_COLS = preprocess["cat_cols"]


# --------------------------------
# Prepare tabular input
# --------------------------------

def prepare_tabular(project):

    row = dict(project)

    for col in CAT_COLS:
        value = row[col]

        if value not in CAT_MAPS[col]:
            raise ValueError(
                f"Unknown {col}: {value}"
            )

        row[col] = CAT_MAPS[col][value]

    missing = [
        col
        for col in FEATURES
        if col not in row
    ]

    if missing:
        raise ValueError(
            f"Missing features: {missing}"
        )

    return pd.DataFrame(
        [[row[col] for col in FEATURES]],
        columns=FEATURES
    )


# --------------------------------
# Prepare numeric input
# --------------------------------

def prepare_numeric(project):

    row = dict(project)

    values = [
        float(row[col])
        for col in NUM_COLS
    ]

    return pd.DataFrame(
        [values],
        columns=NUM_COLS
    )


# --------------------------------
# Risk prediction
# --------------------------------

def predict_risk(tabular):

    probability = float(
        risk_model.predict_proba(tabular)[0][1]
    )

    prediction = (
        "HIGH_RISK"
        if probability >= 0.5
        else "LOW_RISK"
    )

    return {
        "probability": round(
            probability,
            4
        ),
        "prediction": prediction
    }


# --------------------------------
# Cost prediction
# --------------------------------

def predict_cost(tabular):

    value = float(
        cost_model.predict(tabular)[0]
    )

    return {
        "predicted_overrun_ratio": round(
            value,
            4
        )
    }


# --------------------------------
# Anomaly detection
# --------------------------------

def predict_anomaly(numeric):

    scaler = anomaly_artifact["scaler"]
    model = anomaly_artifact["model"]

    scaled = scaler.transform(numeric)

    prediction = int(
        model.predict(scaled)[0]
    )

    score = float(
        model.decision_function(scaled)[0]
    )

    return {
        "is_anomaly": prediction == -1,
        "score": round(
            score,
            4
        )
    }


# --------------------------------
# Similar projects
# --------------------------------

def find_similar(
    numeric,
    current_project_id,
    n=5
):

    scaler = knn_artifact["scaler"]
    model = knn_artifact["model"]
    project_ids = knn_artifact["index_project_ids"]

    scaled = scaler.transform(numeric)

    distances, indices = model.kneighbors(
        scaled,
        n_neighbors=min(
            n + 1,
            len(project_ids)
        )
    )

    results = []

    for distance, index in zip(
        distances[0],
        indices[0]
    ):

        project_id = project_ids[index]

        # Skip the project itself
        if project_id == current_project_id:
            continue

        results.append({
            "project_id": project_id,
            "distance": round(
                float(distance),
                4
            )
        })

        if len(results) == n:
            break

    return results


# --------------------------------
# NLP remark analysis
# --------------------------------

def predict_remark(remark):

    process = subprocess.run(
        [
            sys.executable,
            "src/nlp_infer.py",
            str(remark)
        ],
        capture_output=True,
        text=True
    )

    if process.returncode != 0:

        return {
            "category": "unavailable",
            "confidence": 0.0,
            "error": process.stderr.strip()[-200:]
        }

    output_lines = (
        process.stdout
        .strip()
        .splitlines()
    )

    if not output_lines:

        return {
            "category": "unavailable",
            "confidence": 0.0,
            "error": "NLP worker returned no output"
        }

    return json.loads(
        output_lines[-1]
    )


# --------------------------------
# Full NIVARA prediction
# --------------------------------

def predict(project):

    tabular = prepare_tabular(project)
    numeric = prepare_numeric(project)

    result = {

        "project_id": project.get(
            "project_id"
        ),

        "month_index": project.get(
            "month_index"
        ),

        "risk": predict_risk(
            tabular
        ),

        "cost": predict_cost(
            tabular
        ),

        "anomaly": predict_anomaly(
            numeric
        ),

        "remark_analysis": predict_remark(
            project["remark"]
        ),

        "similar_projects": find_similar(
            numeric,
            project.get("project_id")
        ),

        "top_risk_drivers": (
            shap_importance
            .head(6)
            .to_dict("records")
        )
    }

    return result


# --------------------------------
# Main
# --------------------------------

if __name__ == "__main__":

    print(
        "Loading NIVARA test project..."
    )

    df = pd.read_csv(
        "data/nivara_features.csv"
    )

    sample = df.iloc[0].to_dict()

    print(
        "\nRunning inference..."
    )

    result = predict(sample)

    print(
        json.dumps(
            result,
            indent=2
        )
    )

    with open(
        "data/inference_result.json",
        "w"
    ) as f:

        json.dump(
            result,
            f,
            indent=2
        )

    print(
        "\nSaved inference result to "
        "data/inference_result.json"
    )

    print(
        "\nSTEP 4B DONE — NIVARA "
        "inference pipeline working"
    )
