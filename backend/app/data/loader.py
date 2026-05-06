import random
from collections import Counter, defaultdict
from datasets import load_dataset


def load_tweet_eval():
    ds = load_dataset("cardiffnlp/tweet_eval", "sentiment")
    records = []
    for split in ["train", "validation", "test"]:
        for item in ds[split]:
            records.append({
                "text": item["text"],
                "sentiment_label": item["label"],  # 0=negative, 1=neutral, 2=positive
                "emotion_label": None,
                "source": "tweet_eval",
            })
    return records


def load_go_emotions():
    emotion_to_sentiment = {
        "joy": 2,
        "anger": 0,
        "fear": 0,
        "sadness": 0,
        "neutral": 1,
    }

    ds = load_dataset("go_emotions", "simplified")

    try:
        label_names = ds["train"].features["labels"].feature.names
        keep_indices = {i: name for i, name in enumerate(label_names) if name in emotion_to_sentiment}
    except (AttributeError, KeyError):
        # fallback for known go_emotions simplified indices
        keep_indices = {2: "anger", 14: "fear", 17: "joy", 25: "sadness", 27: "neutral"}

    records = []
    for split in ["train", "validation", "test"]:
        for item in ds[split]:
            labels = item["labels"]
            matching = [l for l in labels if l in keep_indices]
            if len(matching) == 1:
                emotion_name = keep_indices[matching[0]]
                records.append({
                    "text": item["text"],
                    "sentiment_label": emotion_to_sentiment[emotion_name],
                    "emotion_label": emotion_name,
                    "source": "go_emotions",
                })
    return records


def balance_dataset(records):
    by_class = defaultdict(list)
    for r in records:
        by_class[r["sentiment_label"]].append(r)

    min_count = min(len(v) for v in by_class.values())
    target = min_count * 2

    balanced = []
    for label, items in by_class.items():
        if len(items) > target:
            items = random.sample(items, target)
        balanced.extend(items)

    random.shuffle(balanced)

    final_counts = Counter(r["sentiment_label"] for r in balanced)
    label_names = {0: "negative", 1: "neutral", 2: "positive"}
    print("Class distribution after balancing:")
    for label, count in sorted(final_counts.items()):
        print(f"  {label_names[label]}: {count}")

    return balanced


def load_all():
    print("Loading tweet_eval...")
    tweet_records = load_tweet_eval()
    print(f"  {len(tweet_records)} records")

    print("Loading go_emotions...")
    emotion_records = load_go_emotions()
    print(f"  {len(emotion_records)} records")

    all_records = tweet_records + emotion_records
    print(f"Total before balancing: {len(all_records)}")

    balanced = balance_dataset(all_records)
    print(f"Total after balancing: {len(balanced)}")

    return balanced
