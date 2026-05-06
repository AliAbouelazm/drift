import os
import json
import torch
import numpy as np
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
from sklearn.metrics import classification_report, confusion_matrix

from app.data.loader import load_all
from app.data.preprocessor import preprocess

SAVE_DIR = os.path.join(os.path.dirname(__file__), "saved_model")
LABEL_NAMES = ["negative", "neutral", "positive"]


def evaluate():
    records = load_all()
    _, _, test_ds, _ = preprocess(records)

    config_path = os.path.join(SAVE_DIR, "config.json")
    if not os.path.exists(config_path):
        raise RuntimeError(f"No model at {SAVE_DIR}. Run training first.")

    if torch.backends.mps.is_available():
        device = "mps"
    elif torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"

    model = DistilBertForSequenceClassification.from_pretrained(SAVE_DIR)
    model = model.to(device)
    model.eval()

    all_preds = []
    all_labels = []
    all_texts = test_ds["text"]

    batch_size = 64
    for i in range(0, len(test_ds), batch_size):
        batch = test_ds[i : i + batch_size]
        input_ids = torch.tensor(batch["input_ids"]).to(device)
        attention_mask = torch.tensor(batch["attention_mask"]).to(device)
        with torch.no_grad():
            logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
        preds = logits.argmax(dim=-1).cpu().numpy()
        all_preds.extend(preds.tolist())
        all_labels.extend(batch["labels"])

    print(classification_report(all_labels, all_preds, target_names=LABEL_NAMES))

    cm = confusion_matrix(all_labels, all_preds)
    cm_dict = {"labels": LABEL_NAMES, "matrix": cm.tolist()}

    misclassified = []
    for i, (pred, label) in enumerate(zip(all_preds, all_labels)):
        if pred != label and len(misclassified) < 20:
            misclassified.append({
                "text": all_texts[i],
                "true_label": LABEL_NAMES[label],
                "predicted_label": LABEL_NAMES[pred],
            })

    with open(os.path.join(SAVE_DIR, "confusion_matrix.json"), "w") as f:
        json.dump(cm_dict, f, indent=2)

    with open(os.path.join(SAVE_DIR, "misclassified.json"), "w") as f:
        json.dump(misclassified, f, indent=2)

    print(f"Saved confusion_matrix.json and misclassified.json to {SAVE_DIR}")
    return cm_dict


if __name__ == "__main__":
    evaluate()
