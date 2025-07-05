import os
import logging
import pandas as pd
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer, util, InputExample, losses
from torch.utils.data import DataLoader
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from huggingface_hub import HfApi
from huggingface_hub.utils import HfHubHTTPError

# ---- Setup
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Load summarization model
summarizer_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")
summarizer_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")

# Hugging Face config
HF_MODEL_NAME = "fine-tuned-resume-matcher"
HF_TOKEN = os.getenv("HF_TOKEN")  # from environment variable

# Load SBERT model
model_path = "fine-tuned-resume-model"
base_model_name = 'sentence-transformers/all-MiniLM-L6-v2'

if os.path.exists(model_path):
    logging.info("🔁 Loading fine-tuned model...")
    model = SentenceTransformer(model_path)
else:
    logging.info("✨ Loading base SBERT model...")
    model = SentenceTransformer(base_model_name)

tokenizer = AutoTokenizer.from_pretrained(base_model_name)


# ---- Utilities
def extract_text_from_pdf(pdf_file):
    reader = PdfReader(pdf_file)
    return ''.join(page.extract_text() or '' for page in reader.pages)

def extract_section(text, keyword):
    pattern = rf"{keyword}[\s:]*([\s\S]+?)(?:\n[A-Z][a-z]+:|\Z)"
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else ""


def generate_summary(text):
    prompt = f"Summarize the candidate's resume focusing on job-relevant skills and experience:\n\n{text}"
    inputs = summarizer_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    outputs = summarizer_model.generate(**inputs, max_length=150, num_beams=4, early_stopping=True)
    return summarizer_tokenizer.decode(outputs[0], skip_special_tokens=True)

def semantic_similarity(text1, text2):
    text1 = text1[:1000]  # Truncate to avoid token overflow
    text2 = text2[:1000]
    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)
    score = util.pytorch_cos_sim(emb1, emb2).item()
    return round(score * 100)


# ---- Resume Analysis
@app.route("/analyze_resume", methods=["POST"])
def analyze_resume():
    required_fields = ['skills', 'experience', 'education', 'tools', 'description']

    if 'resumes' not in request.files or not all(f in request.form and request.form[f].strip() for f in required_fields):
        return jsonify({"error": "Missing required form fields"}), 400

    job_data = {field: request.form[field].strip() for field in required_fields}
    uploaded_files = request.files.getlist('resumes')
    combined_job_text = ' '.join(job_data.values())

    results = []
    for file in uploaded_files:
        try:
            text = extract_text_from_pdf(file)
            tokens = tokenizer.tokenize(text)
            num_tokens = len(tokens)

            # Extract sections or fallback to full resume
            resume_data = {
    "skills": extract_section(text, "skills") or text,
    "experience": extract_section(text, "experience") or text,
    "education": extract_section(text, "education") or text,
    "tools": extract_section(text, "tools") or text,
    "description": extract_section(text, "description") or text
}


            # DEBUG logs
            print("📄", file.filename)
            for k, v in resume_data.items():
                print(f"🔍 {k}: {v[:200]}...\n")  # print first 200 chars

            # Calculate section-wise similarity
            scores = []
            for field in ['skills', 'experience', 'education', 'tools', 'description']:
                res_part = resume_data[field]
                job_part = job_data[field]
                if res_part and job_part:
                    scores.append(util.pytorch_cos_sim(
                    model.encode(res_part[:1000], convert_to_tensor=True),
                    model.encode(job_part[:1000], convert_to_tensor=True)
                ).item())


            match_score = round((sum(scores) / len(scores)) * 100) if scores else 0

            summary = generate_summary(text)

            results.append({
                "filename": file.filename,
                "match_percentage": match_score,
                "summary": summary,
                "tokens_used": num_tokens,
                "missing_skills": []  # Placeholder
            })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "match_percentage": 0,
                "summary": f"Error: {str(e)}",
                "tokens_used": 0,
                "missing_skills": []
            })

    return jsonify(results)


# ---- Fine-tuning endpoint
@app.route("/train", methods=["POST"])
def train_model():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "CSV file missing"}), 400

        df = pd.read_csv(request.files['file'])
        if not {'resume_text', 'job_desc', 'label'}.issubset(df.columns):
            return jsonify({"error": "CSV must have columns: resume_text, job_desc, label"}), 400

        train_examples = [
            InputExample(texts=[row['resume_text'], row['job_desc']], label=float(row['label']))
            for _, row in df.iterrows()
        ]

        train_loader = DataLoader(train_examples, shuffle=True, batch_size=16)
        loss_fn = losses.CosineSimilarityLoss(model)

        logging.info("🚀 Fine-tuning started...")
        model.fit(train_objectives=[(train_loader, loss_fn)], epochs=2, warmup_steps=100, show_progress_bar=True)

        model.save(model_path)
        logging.info("✅ Model fine-tuned and saved.")
        return jsonify({"message": "Model fine-tuned and saved."})

    except Exception as e:
        logging.error(f"❌ Training failed: {e}")
        return jsonify({"error": str(e)}), 500


# ---- Push to Hugging Face
@app.route("/push_model", methods=["POST"])
def push_model():
    if not HF_TOKEN:
        return jsonify({"error": "HF_TOKEN environment variable not set."}), 401

    try:
        api = HfApi()
        username = api.whoami(token=HF_TOKEN)['name']
        repo_id = f"{username}/{HF_MODEL_NAME}"

        model.push_to_hub(repo_id, use_auth_token=HF_TOKEN)
        return jsonify({"message": f"Model pushed to Hugging Face: https://huggingface.co/{repo_id}"})

    except HfHubHTTPError as e:
        return jsonify({"error": f"HuggingFace Hub error: {str(e)}"}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- Starter
if __name__ == "__main__":
    app.run(debug=True)
