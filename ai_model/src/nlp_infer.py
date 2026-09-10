import sys
import json
import torch
from transformers import (
    DistilBertForSequenceClassification,
    DistilBertTokenizerFast,
)

BASE = "models"

model = DistilBertForSequenceClassification.from_pretrained(
    f"{BASE}/distilbert_remarks"
)
tok = DistilBertTokenizerFast.from_pretrained(
    f"{BASE}/distilbert_remarks"
)

model.eval()

remark = sys.argv[1] if len(sys.argv) > 1 else ""

inputs = tok(
    remark,
    return_tensors="pt",
    truncation=True,
    padding=True,
    max_length=256,
)

with torch.no_grad():
    probs = torch.softmax(
        model(**inputs).logits,
        dim=-1
    )[0]

cid = int(torch.argmax(probs))

print(json.dumps({
    "category": model.config.id2label[cid],
    "confidence": round(float(probs[cid]), 4),
}))
