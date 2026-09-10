"""
NIVARA — Step 3: fine-tune DistilBERT to classify free-text delay remarks.

Run (on your Mac, inside the nivara env):
    pip install "torch" "transformers[torch]" "datasets" "scikit-learn"
    python src/03_train_nlp.py

What it does:
  Takes each project's free-text remark (e.g. "land acquisition pending") and
  learns to sort it into a reason category:
      land_acquisition | contractor_issue | funds_delay | environmental | on_track
  DistilBERT is a small, fast version of BERT — good for a laptop.

Where the labels come from:
  The synthetic data already ships each remark with its true category, so you
  have a ready-made labelled set to train on immediately. For REAL PAIMANA
  remarks you would hand-label a starter set the same way: put the remark text
  in one column and your chosen category in the next, ~30-50 examples per
  category is enough to start, then point THIS script at that CSV instead.

DONE looks like: training runs for a few epochs, it prints test accuracy and
macro-F1 from YOUR run, and a model is saved under models/distilbert_remarks/.
"""

from pathlib import Path
import numpy as np
import pandas as pd

ROOT   = Path(__file__).resolve().parents[1]
DATA   = ROOT / "data" / "nivara_features.csv"
OUTDIR = ROOT / "models" / "distilbert_remarks"
OUTDIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "distilbert-base-uncased"
EPOCHS = 3
MAXLEN = 32                      # remarks are short, so short sequences are fine


def load_labelled_remarks():
    """Return a dataframe with columns: text, label_name.
    Swap this function to read your own hand-labelled CSV for real data:
        return pd.read_csv('data/real_remarks_labelled.csv')  # cols: text,label_name
    """
    df = pd.read_csv(DATA)[["remark", "remark_category"]].dropna()
    df = df.rename(columns={"remark": "text", "remark_category": "label_name"})
    # Take a balanced sample: up to 300 remarks per category. There is real
    # phrasing variety (~10 templates per category), so the model learns the
    # language of each reason rather than memorising one sentence.
    parts = [g.sample(min(len(g), 300), random_state=42)
             for _, g in df.groupby("label_name")]
    out = pd.concat(parts, ignore_index=True)
    return out.sample(frac=1, random_state=42).reset_index(drop=True)


def main():
    # Heavy libraries imported inside main so the file loads even before install.
    import torch
    from transformers import (AutoTokenizer, AutoModelForSequenceClassification,
                              TrainingArguments, Trainer)
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, f1_score

    df = load_labelled_remarks()
    labels = sorted(df["label_name"].unique())
    label2id = {l: i for i, l in enumerate(labels)}
    id2label = {i: l for l, i in label2id.items()}
    df["label"] = df["label_name"].map(label2id)
    print(f"Examples: {len(df)}  Classes: {labels}")

    train_df, test_df = train_test_split(
        df, test_size=0.25, random_state=42, stratify=df["label"])

    tok = AutoTokenizer.from_pretrained(MODEL_NAME)

    class DS(torch.utils.data.Dataset):
        def __init__(self, frame):
            self.enc = tok(list(frame["text"]), truncation=True, padding="max_length",
                           max_length=MAXLEN, return_tensors="pt")
            self.y = torch.tensor(frame["label"].values)
        def __len__(self):  return len(self.y)
        def __getitem__(self, i):
            item = {k: v[i] for k, v in self.enc.items()}
            item["labels"] = self.y[i]
            return item

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME, num_labels=len(labels), id2label=id2label, label2id=label2id)

    def metrics(pred):
        y = pred.label_ids
        p = pred.predictions.argmax(-1)
        return {"accuracy": accuracy_score(y, p),
                "macro_f1": f1_score(y, p, average="macro")}

    args = TrainingArguments(
        output_dir=str(OUTDIR / "_train"),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=32,
        eval_strategy="epoch",
        logging_steps=20,
        report_to="none",
        seed=42,
    )
    trainer = Trainer(model=model, args=args,
                      train_dataset=DS(train_df), eval_dataset=DS(test_df),
                      compute_metrics=metrics)
    trainer.train()
    final = trainer.evaluate()
    print(f"\nTEST accuracy={final['eval_accuracy']:.3f}  "
          f"macro-F1={final['eval_macro_f1']:.3f}")

    model.save_pretrained(OUTDIR)
    tok.save_pretrained(OUTDIR)
    print(f"Saved DistilBERT -> {OUTDIR}")
    print("STEP 3 DONE")


if __name__ == "__main__":
    main()

