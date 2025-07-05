from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import pandas as pd
import joblib
import os

# Sample training data
data = {
    "sentence": [
        "I have experience with Python and Django.",
        "I am poor in Python.",
        "Skilled in Java and Spring Boot.",
        "No knowledge of AWS.",
        "Built REST APIs with Flask.",
        "Still learning C++.",
        "Developed with React.",
        "Don't like Excel."
    ],
    "label": [1, 0, 1, 0, 1, 0, 1, 0]
}
df = pd.DataFrame(data)

# Train SBERT + Logistic Regression
sbert = SentenceTransformer("all-MiniLM-L6-v2")
X = sbert.encode(df["sentence"].tolist())
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = LogisticRegression()
clf.fit(X_train, y_train)

# Save model directory if not exists
os.makedirs("model", exist_ok=True)
joblib.dump(clf, "model/logistic_model.joblib")
sbert.save("model/sbert")
