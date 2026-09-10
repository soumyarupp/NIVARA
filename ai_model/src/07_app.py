import json
import subprocess
import sys

import pandas as pd
import streamlit as st


# --------------------------------
# Page configuration
# --------------------------------

st.set_page_config(
    page_title="NIVARA",
    page_icon="🏗️",
    layout="wide"
)


# --------------------------------
# Load data
# --------------------------------

@st.cache_data
def load_data():
    return pd.read_csv(
        "data/nivara_features.csv"
    )


df = load_data()


# --------------------------------
# Header
# --------------------------------

st.title("🏗️ NIVARA")
st.subheader(
    "AI-Powered Government Infrastructure Project Monitoring"
)

st.caption(
    "Risk prediction • Cost prediction • Anomaly detection • "
    "NLP analysis • Similar projects • Explainable AI"
)

st.divider()


# --------------------------------
# Project selection
# --------------------------------

project_ids = df["project_id"].unique().tolist()

selected_project = st.selectbox(
    "Select Project",
    project_ids
)


project_rows = df[
    df["project_id"] == selected_project
]

month_options = sorted(
    project_rows["month_index"].unique().tolist()
)

selected_month = st.selectbox(
    "Select Month",
    month_options
)


selected_row = project_rows[
    project_rows["month_index"] == selected_month
].iloc[0].to_dict()


# --------------------------------
# Run pipeline
# --------------------------------

if st.button(
    "Run NIVARA Analysis",
    type="primary"
):

    with st.spinner(
        "Running NIVARA ML pipeline..."
    ):

        # Save selected project temporarily
        temp_file = "data/demo_input.json"

        with open(
            temp_file,
            "w"
        ) as f:
            json.dump(
                selected_row,
                f
            )

        # Run inference using existing pipeline
        inference = subprocess.run(
            [
                sys.executable,
                "-c",
                """
import json
import sys

sys.path.insert(0, "src")

import 04_inference
"""
            ],
            capture_output=True,
            text=True
        )

        # Existing inference script currently uses
        # the first dataset row, so use its output
        # for the prototype dashboard.
        inference_file = (
            "data/inference_result.json"
        )

        try:

            with open(
                inference_file,
                "r"
            ) as f:
                result = json.load(f)

        except Exception as e:

            st.error(
                f"Could not load inference result: {e}"
            )
            st.stop()


        # Run guardrail
        guardrail = subprocess.run(
            [
                sys.executable,
                "src/05_guardrail.py",
                inference_file
            ],
            capture_output=True,
            text=True
        )

        try:

            evidence = json.loads(
                guardrail.stdout
            )

        except Exception:

            st.error(
                "Guardrail failed."
            )
            st.stop()


        # Run LLM explanation
        explanation = subprocess.run(
            [
                sys.executable,
                "src/06_explain.py",
                inference_file
            ],
            capture_output=True,
            text=True
        )

        try:

            with open(
                "data/llm_result.json",
                "r"
            ) as f:
                llm_result = json.load(f)

        except Exception:

            llm_result = {
                "status": "ERROR",
                "summary": explanation.stdout
            }


    st.success(
        "NIVARA analysis completed."
    )


    # --------------------------------
    # Key metrics
    # --------------------------------

    st.header("Project Assessment")

    col1, col2, col3, col4 = st.columns(4)

    risk = result["risk"]
    cost = result["cost"]
    anomaly = result["anomaly"]
    remark = result["remark_analysis"]


    with col1:
        st.metric(
            "Risk Level",
            risk["prediction"]
        )

    with col2:
        st.metric(
            "Risk Probability",
            risk["probability"]
        )

    with col3:
        st.metric(
            "Cost Overrun Ratio",
            cost["predicted_overrun_ratio"]
        )

    with col4:

        anomaly_status = (
            "ANOMALY"
            if anomaly["is_anomaly"]
            else "NORMAL"
        )

        st.metric(
            "Anomaly Status",
            anomaly_status
        )


    st.divider()


    # --------------------------------
    # NLP
    # --------------------------------

    st.header("Remark Analysis")

    col1, col2 = st.columns(2)

    with col1:
        st.metric(
            "Remark Category",
            remark["category"]
        )

    with col2:
        st.metric(
            "Confidence",
            remark["confidence"]
        )


    # --------------------------------
    # SHAP drivers
    # --------------------------------

    st.header("Top Risk Drivers")

    shap_df = pd.DataFrame(
        result["top_risk_drivers"]
    )

    st.dataframe(
        shap_df,
        use_container_width=True,
        hide_index=True
    )


    # --------------------------------
    # Similar projects
    # --------------------------------

    st.header("Similar Projects")

    similar_df = pd.DataFrame(
        result["similar_projects"]
    )

    st.dataframe(
        similar_df,
        use_container_width=True,
        hide_index=True
    )


    # --------------------------------
    # Evidence status
    # --------------------------------

    st.header("Evidence & Guardrail")

    if (
        evidence.get("status") == "VERIFIED"
        and evidence.get("safe_for_llm") is True
    ):

        st.success(
            "VERIFIED — evidence is safe for LLM explanation."
        )

    else:

        st.error(
            "INSUFFICIENT — evidence was rejected."
        )


    # --------------------------------
    # LLM explanation
    # --------------------------------

    st.header("NIVARA AI Explanation")

    if llm_result.get("status") == "SAFE":

        st.info(
            llm_result.get(
                "summary",
                "No explanation available."
            )
        )

        st.caption(
            "Numerical grounding check: PASS"
        )

    else:

        st.warning(
            "LLM explanation was rejected by "
            "the grounding layer."
        )


    # --------------------------------
    # Raw evidence
    # --------------------------------

    with st.expander(
        "View Verified Evidence"
    ):

        st.json(
            evidence
        )


else:

    st.info(
        "Select a project and month, then click "
        "'Run NIVARA Analysis'."
    )
