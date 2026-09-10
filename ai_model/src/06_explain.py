import sys
import json
import re
import subprocess
import requests


INPUT = (
    sys.argv[1]
    if len(sys.argv) > 1
    else "data/inference_result.json"
)


# --------------------------------
# Run guardrail first
# --------------------------------

guardrail = subprocess.run(
    [
        sys.executable,
        "src/05_guardrail.py",
        INPUT
    ],
    capture_output=True,
    text=True
)

if guardrail.returncode != 0:
    print("LLM BLOCKED — guardrail failed.")
    print(guardrail.stderr)
    sys.exit(1)


guardrail_output = json.loads(guardrail.stdout)


# --------------------------------
# Require verified evidence
# --------------------------------

if (
    guardrail_output.get("status") != "VERIFIED"
    or guardrail_output.get("safe_for_llm") is not True
):
    print("LLM BLOCKED — evidence failed validation.")
    print(json.dumps(guardrail_output, indent=2))
    sys.exit(1)


evidence = guardrail_output["evidence"]


# --------------------------------
# Build LLM prompt
# --------------------------------

prompt = f"""
You are NIVARA's reporting assistant for
government infrastructure project monitoring.

Use ONLY the verified evidence below.

Write a concise paragraph for a government project officer.

Rules:
1. Do not invent facts or numbers.
2. Do not change any model prediction.
3. Do not make unsupported claims.
4. Use numerical values exactly as provided when possible.
5. State the risk level exactly as given (LOW_RISK or HIGH_RISK).
6. Do not add risk qualifiers such as "moderate", "high", or "low" unless they are explicitly present in the evidence.
7. Do not interpret similarity distances as similarity claims unless the evidence explicitly supports that interpretation.
8. If evidence is insufficient to make an interpretation, say "insufficient evidence".
VERIFIED EVIDENCE:
{json.dumps(evidence, indent=2)}
"""


# --------------------------------
# Call local Ollama
# --------------------------------

response = requests.post(
    "http://127.0.0.1:11434/api/generate",
    json={
        "model": "llama3.2",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    },
    timeout=120
)

response.raise_for_status()

summary = response.json()["response"].strip()


print("\n--- NIVARA LLM SUMMARY ---")
print(summary)


# --------------------------------
# Grounding check
# --------------------------------

evidence_text = json.dumps(evidence)

evidence_numbers = [
    float(number)
    for number in re.findall(
        r"\b\d+(?:\.\d+)?\b",
        evidence_text
    )
]

summary_numbers = [
    float(number)
    for number in re.findall(
        r"\b\d+(?:\.\d+)?\b",
        summary
    )
]

unverified = []

for number in summary_numbers:
    if not any(
        abs(number - evidence_number) <= 0.0001
        for evidence_number in evidence_numbers
    ):
        unverified.append(number)


print("\n--- GROUNDING CHECK ---")

if unverified:
    print("REJECTED")
    print(
        "Numbers not found in evidence:",
        unverified
    )
else:
    print(
        "PASS — all numerical claims are grounded "
        "in verified evidence."
    )


# --------------------------------
# Save result
# --------------------------------

result = {
    "status": "REJECTED" if unverified else "SAFE",
    "summary": summary,
    "unverified_numbers": unverified
}

with open(
    "data/llm_result.json",
    "w"
) as f:
    json.dump(
        result,
        f,
        indent=2
    )

print("\nSaved LLM result to data/llm_result.json")
