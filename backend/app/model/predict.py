import os
import torch
import numpy as np
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
import shap

MODEL_DIR = os.environ.get("MODEL_PATH", os.path.join(os.path.dirname(__file__), "saved_model"))
LABEL_NAMES = ["negative", "neutral", "positive"]

_model = None
_tokenizer = None
_device = None


def _load_model():
    global _model, _tokenizer, _device

    if _model is not None:
        return

    config_path = os.path.join(MODEL_DIR, "config.json")
    if not os.path.exists(config_path):
        raise RuntimeError(
            f"No trained model found at {MODEL_DIR}. Run: python -m app.model.train"
        )

    if torch.backends.mps.is_available():
        _device = "mps"
    elif torch.cuda.is_available():
        _device = "cuda"
    else:
        _device = "cpu"

    _tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_DIR)
    _model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
    _model = _model.to(_device)
    _model.eval()
    print(f"Model loaded on {_device}")


def _tokenize(texts):
    return _tokenizer(
        texts,
        max_length=128,
        truncation=True,
        padding=True,
        return_tensors="pt",
    )


def predict_single(text):
    _load_model()
    inputs = _tokenize([text])
    inputs = {k: v.to(_device) for k, v in inputs.items()}
    with torch.no_grad():
        logits = _model(**inputs).logits
    probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]
    label_idx = int(np.argmax(probs))
    return {
        "label": LABEL_NAMES[label_idx],
        "label_idx": label_idx,
        "scores": {
            "negative": float(probs[0]),
            "neutral": float(probs[1]),
            "positive": float(probs[2]),
        },
    }


def predict_batch(texts):
    _load_model()
    results = []
    batch_size = 64
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        inputs = _tokenize(batch)
        inputs = {k: v.to(_device) for k, v in inputs.items()}
        with torch.no_grad():
            logits = _model(**inputs).logits
        probs = torch.softmax(logits, dim=-1).cpu().numpy()
        for prob in probs:
            label_idx = int(np.argmax(prob))
            results.append({
                "label": LABEL_NAMES[label_idx],
                "label_idx": label_idx,
                "scores": {
                    "negative": float(prob[0]),
                    "neutral": float(prob[1]),
                    "positive": float(prob[2]),
                },
            })
    return results


def explain(text):
    _load_model()

    def predict_fn(texts):
        texts = [str(t) for t in texts]
        inputs = _tokenize(texts)
        inputs = {k: v.to(_device) for k, v in inputs.items()}
        with torch.no_grad():
            logits = _model(**inputs).logits
        return torch.softmax(logits, dim=-1).cpu().numpy()

    masker = shap.maskers.Text(_tokenizer)
    explainer = shap.Explainer(predict_fn, masker, output_names=LABEL_NAMES)
    shap_values = explainer([text], max_evals=200)

    pred = predict_single(text)
    class_idx = pred["label_idx"]

    tokens = shap_values.data[0]
    values = shap_values.values[0][:, class_idx]

    token_scores = [
        {"token": str(t), "score": float(v)} for t, v in zip(tokens, values)
    ]
    token_scores.sort(key=lambda x: abs(x["score"]), reverse=True)
    return token_scores[:5]
