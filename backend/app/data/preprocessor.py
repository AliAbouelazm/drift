import re
import pandas as pd
from datasets import Dataset
from sklearn.model_selection import train_test_split
from transformers import DistilBertTokenizerFast


def clean_text(text):
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#\w+", "", text)
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def preprocess(records):
    tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

    df = pd.DataFrame(records)
    df["text"] = df["text"].apply(clean_text)
    df = df[df["text"].str.len() > 0].reset_index(drop=True)

    train_df, temp_df = train_test_split(
        df, test_size=0.30, stratify=df["sentiment_label"], random_state=42
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, stratify=temp_df["sentiment_label"], random_state=42
    )

    def tokenize_batch(batch):
        return tokenizer(
            batch["text"],
            max_length=128,
            truncation=True,
            padding="max_length",
        )

    def make_dataset(df):
        ds = Dataset.from_dict({
            "text": df["text"].tolist(),
            "labels": df["sentiment_label"].tolist(),
        })
        return ds.map(tokenize_batch, batched=True)

    train_ds = make_dataset(train_df)
    val_ds = make_dataset(val_df)
    test_ds = make_dataset(test_df)

    return train_ds, val_ds, test_ds, tokenizer
