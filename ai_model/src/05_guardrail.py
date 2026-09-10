import json
import sys


def validate_result(result):
    errors = []

    required = [
        "project_id",
        "month_index",
        "risk",
        "cost",
        "anomaly",
        "remark_analysis",
        "similar_projects",
        "top_risk_drivers",
    ]

    for key in required:
        if key not in result:
            errors.append(f"Missing field: {key}")

    # Risk validation
    if "risk" in result:
        risk = result["risk"]

        if "probability" not in risk:
            errors.append("Missing risk probability")
        else:
            probability = risk["probability"]
            if not isinstance(probability, (int, float)):
                errors.append("Risk probability must be numeric")
            elif not 0 <= probability <= 1:
                errors.append("Risk probability must be between 0 and 1")

        if "prediction" not in risk:
            errors.append("Missing risk prediction")

    # Cost validation
    if "cost" in result:
        if "predicted_overrun_ratio" not in result["cost"]:
            errors.append("Missing cost overrun ratio")

    # Anomaly validation
    if "anomaly" in result:
        if "is_anomaly" not in result["anomaly"]:
            errors.append("Missing anomaly flag")

        if "score" not in result["anomaly"]:
            errors.append("Missing anomaly score")

    # NLP validation
    if "remark_analysis" in result:
        remark = result["remark_analysis"]

        if "category" not in remark:
            errors.append("Missing remark category")

        if "confidence" not in remark:
            errors.append("Missing remark confidence")
        else:
            confidence = remark["confidence"]
            if not isinstance(confidence, (int, float)):
                errors.append("Remark confidence must be numeric")
            elif not 0 <= confidence <= 1:
                errors.append("Remark confidence must be between 0 and 1")

    # Similar projects validation
    if "similar_projects" in result:
        if not isinstance(result["similar_projects"], list):
            errors.append("similar_projects must be a list")

    # SHAP validation
    if "top_risk_drivers" in result:
        if not isinstance(result["top_risk_drivers"], list):
            errors.append("top_risk_drivers must be a list")

    return errors


def build_evidence(result):
    errors = validate_result(result)

    if errors:
        return {
            "status": "INSUFFICIENT",
            "safe_for_llm": False,
            "errors": errors,
            "evidence": {},
        }

    return {
        "status": "VERIFIED",
        "safe_for_llm": True,
        "evidence": {
            "project_id": result["project_id"],
            "month_index": result["month_index"],
            "risk": result["risk"],
            "cost": result["cost"],
            "anomaly": result["anomaly"],
            "remark_analysis": result["remark_analysis"],
            "similar_projects": result["similar_projects"],
            "top_risk_drivers": result["top_risk_drivers"],
        },
        "llm_rules": [
            "Use only the verified evidence provided.",
            "Do not invent numerical values.",
            "Do not change model predictions.",
            "Do not claim evidence that is not present.",
            "If evidence is insufficient, say so.",
        ],
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python src/05_guardrail.py <inference_json>")
        sys.exit(1)

    with open(sys.argv[1], "r") as f:
        result = json.load(f)

    evidence = build_evidence(result)

    print(json.dumps(evidence, indent=2))
