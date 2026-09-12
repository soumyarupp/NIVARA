"""
train_delay_nlp.py
-------------------------------------------------------------------------
NIVARA AI Platform - Model 4: NLP Delay Reason & Constraint Classifier.
Trains TF-IDF + LogisticRegression on Indian infrastructure delay categories.
-------------------------------------------------------------------------
"""

import os
import json
import logging
import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_val_score
from src.utils import logger

CATEGORIES = [
    "Land Acquisition",
    "Fund Shortage",
    "Contractor Issue",
    "Material Shortage",
    "Labour Shortage",
    "Environmental Clearance",
    "Design Change",
    "Legal Issue",
    "Weather or Natural Disaster",
    "Administrative Approval",
    "Utility Shifting",
    "Other"
]

# Curated Indian Infrastructure Domain Training Corpus
INFRA_DELAY_CORPUS = [
    # Land Acquisition
    ("Work delayed due to land acquisition problem and slow compensation disbursement.", "Land Acquisition"),
    ("Forest land diversion and private land acquisition pending from district collector.", "Land Acquisition"),
    ("Delay in possession of land for right of way (RoW) expansion.", "Land Acquisition"),
    ("Encroachments along the alignment not cleared by municipal corporation.", "Land Acquisition"),
    ("Farmer protests against land acquisition rates causing site shutdown.", "Land Acquisition"),
    ("Handover of 15 hectares land parcel delayed by state revenue department.", "Land Acquisition"),
    ("Land disputes between local land owners delaying road construction.", "Land Acquisition"),
    ("Pending land mutation and demarcation by local revenue authority.", "Land Acquisition"),

    # Fund Shortage
    ("State government share of matching funds not released.", "Fund Shortage"),
    ("Budgetary allocation exhausted for current financial year.", "Fund Shortage"),
    ("Delayed bill payment to vendors leading to cash flow stoppage.", "Fund Shortage"),
    ("Pending sanction of revised cost estimate and lack of liquidity.", "Fund Shortage"),
    ("Disbursement of loan tranche delayed by financial institution.", "Fund Shortage"),
    ("Delay in releasing letter of credit (LC) for equipment procurement.", "Fund Shortage"),
    ("Financial crunch with concessionaire halting civil operations.", "Fund Shortage"),

    # Contractor Issue
    ("Contractor terminated due to non-performance and slow site mobilization.", "Contractor Issue"),
    ("Insolvency proceedings initiated against main EPC contractor under IBC.", "Contractor Issue"),
    ("Subcontractor dispute leading to complete suspension of work.", "Contractor Issue"),
    ("Contractor failed to deploy adequate machinery and technical manpower.", "Contractor Issue"),
    ("Liquidity crisis with agency contractor delaying concrete pouring.", "Contractor Issue"),
    ("Contractual arbitration and termination notice issued to vendor.", "Contractor Issue"),

    # Material Shortage
    ("Shortage of aggregate, river sand, and bitumen supply in the district.", "Material Shortage"),
    ("Delay in import of steel girders and critical electronic signaling components.", "Material Shortage"),
    ("Cement supply disrupted due to railway freight congestion.", "Material Shortage"),
    ("Mining ban imposed by NGT on stone quarrying causing raw material crunch.", "Material Shortage"),
    ("Supply chain bottlenecks for specialized high-grade structural steel.", "Material Shortage"),
    ("Scarcity of ballast and rail sleepers at track laying section.", "Material Shortage"),

    # Labour Shortage
    ("Acute shortage of skilled carpenters and bar benders following festival season.", "Labour Shortage"),
    ("Migrant labour returned to home states during harvest season.", "Labour Shortage"),
    ("Local labour strike demanding wage hike halting construction.", "Labour Shortage"),
    ("Insufficient specialized certified welders for pressure vessel fabrication.", "Labour Shortage"),
    ("Labour absenteeism and safety strikes at tunnel portal.", "Labour Shortage"),

    # Environmental Clearance
    ("Pending stage-II forest clearance from MoEFCC.", "Environmental Clearance"),
    ("Tree cutting permission awaiting State Forest Department approval.", "Environmental Clearance"),
    ("Wildlife sanctuary eco-sensitive zone approval pending from National Board.", "Environmental Clearance"),
    ("Coastal Regulation Zone (CRZ) clearance awaited from state authority.", "Environmental Clearance"),
    ("Public hearing and environmental impact assessment (EIA) delayed.", "Environmental Clearance"),
    ("Pollution Control Board consent to establish pending inspection.", "Environmental Clearance"),

    # Design Change
    ("Scope modification: flyover design altered from 4-lane to 6-lane elevated corridor.", "Design Change"),
    ("Alignment revised due to geotechnical challenges and unstable rock strata.", "Design Change"),
    ("Structural drawings revision requested by proof consultant for bridge pier.", "Design Change"),
    ("Foundation redesign required after hard rock was not struck at expected depth.", "Design Change"),
    ("Architectural master plan revised to accommodate metro interchange station.", "Design Change"),

    # Legal Issue
    ("Stay order granted by High Court regarding tender award.", "Legal Issue"),
    ("Litigation filed by land owners pending in Supreme Court.", "Legal Issue"),
    ("Public Interest Litigation (PIL) challenging project alignment.", "Legal Issue"),
    ("National Green Tribunal (NGT) interim stay on construction near riverbed.", "Legal Issue"),
    ("Contractual dispute referred to commercial court arbitration.", "Legal Issue"),

    # Weather or Natural Disaster
    ("Heavy monsoon rains and flooding submerged foundation pits.", "Weather or Natural Disaster"),
    ("Flash floods washed away temporary access roads and Bailey bridge.", "Weather or Natural Disaster"),
    ("Severe cyclonic storm caused extensive structural damage to scaffolding.", "Weather or Natural Disaster"),
    ("Extreme winter sub-zero temperatures and snowfall halted concreting works.", "Weather or Natural Disaster"),
    ("Landslide blocked tunnel portal access in hilly terrain.", "Weather or Natural Disaster"),

    # Administrative Approval
    ("Delay in obtaining railway crossing approval and safety clearance from CRS.", "Administrative Approval"),
    ("Cabinet Committee on Economic Affairs (CCEA) approval awaited for revision.", "Administrative Approval"),
    ("Delay in inter-departmental coordination between NHAI and State PWD.", "Administrative Approval"),
    ("Defence ministry clearance awaited for construction within perimeter.", "Administrative Approval"),
    ("Gram Sabha NOC and village panchayat resolution pending.", "Administrative Approval"),

    # Utility Shifting
    ("Delay in shifting of 220kV high-tension power transmission lines.", "Utility Shifting"),
    ("Underground optical fiber cable (OFC) and water supply pipeline shifting pending.", "Utility Shifting"),
    ("Gas pipeline relocation approval awaited from GAIL / Indian Oil.", "Utility Shifting"),
    ("Sewer line diversion work delayed by municipal utility board.", "Utility Shifting"),
    ("Electric poles not removed by State Electricity Board.", "Utility Shifting"),

    # Other
    ("Delay due to general election code of conduct restrictions.", "Other"),
    ("Law and order issues and security threats in project area.", "Other"),
    ("Routine technical inspection and minor procedural backlog.", "Other"),
    ("Unforeseen underground ancient archaeological artifacts discovered.", "Other")
]


def train_delay_nlp_model(
    vectorizer_output_path: str = "models/delay_vectorizer.joblib",
    model_output_path: str = "models/delay_classifier.joblib"
) -> dict:
    """
    Trains and saves TF-IDF Vectorizer and LogisticRegression classifier
    for infrastructure project delay reason classification.
    """
    texts = [item[0] for item in INFRA_DELAY_CORPUS]
    labels = [item[1] for item in INFRA_DELAY_CORPUS]

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=3000, sublinear_tf=True)
    X = vectorizer.fit_transform(texts)
    y = np.array(labels)

    clf = LogisticRegression(C=5.0, max_iter=1000, class_weight="balanced", random_state=42)

    # 5-fold CV evaluation
    cv = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)
    scores = cross_val_score(clf, X, y, cv=cv, scoring="accuracy")

    # Fit on all examples
    clf.fit(X, y)

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    os.makedirs(os.path.dirname(vectorizer_output_path), exist_ok=True)

    joblib.dump(vectorizer, vectorizer_output_path)
    joblib.dump(clf, model_output_path)

    metrics = {
        "model_name": "TF-IDF + LogisticRegression Delay Classifier",
        "sample_count": len(texts),
        "num_classes": len(CATEGORIES),
        "categories": CATEGORIES,
        "cv_accuracy_mean": round(float(scores.mean()), 4),
        "cv_accuracy_std": round(float(scores.std()), 4),
        "is_trained": True
    }

    logger.info(f"Saved NLP Delay Vectorizer to {vectorizer_output_path} and Classifier to {model_output_path}")
    return metrics


def classify_delay_reason(
    text: str,
    vectorizer_path: str = "models/delay_vectorizer.joblib",
    model_path: str = "models/delay_classifier.joblib"
) -> dict:
    """
    Infers the bottleneck/delay category and prediction confidence for given text.
    """
    if not text or not str(text).strip():
        return {
            "category": "Other",
            "confidence": 1.0,
            "status": "empty_input"
        }

    clean_text = str(text).strip()

    # If models exist, predict with ML
    if os.path.exists(vectorizer_path) and os.path.exists(model_path):
        try:
            vec = joblib.load(vectorizer_path)
            clf = joblib.load(model_path)
            X = vec.transform([clean_text])
            probs = clf.predict_proba(X)[0]
            max_idx = int(np.argmax(probs))
            cat = clf.classes_[max_idx]
            conf = float(probs[max_idx])
            return {
                "category": str(cat),
                "confidence": round(conf, 4),
                "status": "classified"
            }
        except Exception as e:
            logger.warning(f"Error during ML delay classification: {e}")

    # Fallback keyword rules
    text_lower = clean_text.lower()
    keyword_map = {
        "Land Acquisition": ["land", "acquisition", "row", "possession", "encroachment", "compensation", "revenue"],
        "Fund Shortage": ["fund", "funds", "budget", "payment", "liquidity", "cash", "bill", "money", "loan"],
        "Contractor Issue": ["contractor", "subcontractor", "epc", "termination", "insolvency", "arbitration"],
        "Material Shortage": ["material", "steel", "cement", "aggregate", "sand", "bitumen", "quarry", "supply"],
        "Labour Shortage": ["labour", "labor", "worker", "manpower", "strike", "absenteeism", "welders"],
        "Environmental Clearance": ["forest", "environment", "clearance", "wildlife", "moefcc", "crz", "tree", "pollution"],
        "Design Change": ["design", "alignment", "drawing", "scope", "strata", "geotechnical", "modification"],
        "Legal Issue": ["court", "stay", "litigation", "ngt", "pil", "legal", "tribunal", "dispute"],
        "Weather or Natural Disaster": ["weather", "rain", "monsoon", "flood", "cyclone", "snow", "landslide"],
        "Administrative Approval": ["approval", "permission", "ccea", "cabinet", "inter-departmental", "pwd", "railway"],
        "Utility Shifting": ["utility", "pipeline", "electric", "pole", "transmission", "water pipe", "ofc", "cables"]
    }

    for cat, kws in keyword_map.items():
        if any(kw in text_lower for kw in kws):
            return {"category": cat, "confidence": 0.85, "status": "keyword_fallback"}

    return {"category": "Other", "confidence": 0.50, "status": "default_fallback"}


if __name__ == "__main__":
    res = train_delay_nlp_model()
    print("Delay NLP Result:", json.dumps(res, indent=2))
    sample_text = "Work delayed due to land acquisition problem and slow compensation disbursement."
    print("Prediction for sample text:", classify_delay_reason(sample_text))
