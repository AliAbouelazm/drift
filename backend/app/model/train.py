import os
import json
import numpy as np
from transformers import (
    DistilBertForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
)
from sklearn.metrics import f1_score, accuracy_score, classification_report

from app.data.loader import load_all
from app.data.preprocessor import preprocess

SAVE_DIR = os.path.join(os.path.dirname(__file__), "saved_model")
LABEL_NAMES = ["negative", "neutral", "positive"]


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "f1_macro": f1_score(labels, preds, average="macro"),
        "accuracy": accuracy_score(labels, preds),
    }


def train():
    records = load_all()
    train_ds, val_ds, test_ds, tokenizer = preprocess(records)

    model = DistilBertForSequenceClassification.from_pretrained(
        "distilbert-base-uncased",
        num_labels=3,
    )

    total_steps = (len(train_ds) // 32) * 4
    warmup_steps = int(total_steps * 0.10)

    args = TrainingArguments(
        output_dir=SAVE_DIR,
        num_train_epochs=4,
        per_device_train_batch_size=32,
        per_device_eval_batch_size=64,
        learning_rate=2e-5,
        weight_decay=0.01,
        warmup_steps=warmup_steps,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,
        logging_steps=50,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    trainer.train()

    model.save_pretrained(SAVE_DIR)
    tokenizer.save_pretrained(SAVE_DIR)

    test_output = trainer.predict(test_ds)
    preds = np.argmax(test_output.predictions, axis=-1)
    labels = test_output.label_ids

    print("\nTest set results:")
    print(classification_report(labels, preds, target_names=LABEL_NAMES))

    metrics = {
        "f1_macro": float(f1_score(labels, preds, average="macro")),
        "accuracy": float(accuracy_score(labels, preds)),
        "classification_report": classification_report(
            labels, preds, target_names=LABEL_NAMES, output_dict=True
        ),
    }

    with open(os.path.join(SAVE_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Model and metrics saved to {SAVE_DIR}")
    return metrics


if __name__ == "__main__":
    train()
