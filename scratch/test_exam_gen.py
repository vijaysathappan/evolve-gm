import requests
import json

prompt = """You are Evolve AI, a JEE exam generator. The student said: "10 JEE Physics questions on Mechanics, medium difficulty"

Generate a personalised MCQ exam based on their request.

Reply ONLY with this exact JSON — no markdown, no extra text:
{
  "reply": "Short 1-2 sentence confirmation of what exam you're generating",
  "ready": true,
  "questions": [
    {
      "subject": "Physics",
      "q": "question text",
      "opts": ["Option A", "Option B", "Option C", "Option D"],
      "ans": 0,
      "exp": "explanation of the correct answer"
    }
  ]
}

Rules:
- Generate the number of questions the student asked for (default 10, max 15)
- "ans" is the 0-based index of the correct option
- Mix topics as requested
- Make questions appropriate for JEE
- If request is unclear, set "ready": false and ask for clarification in "reply\""""

payload = {
    "query": prompt,
    "chat_data_id": None,
    "user_id": None
}

try:
    response = requests.post("http://localhost:8000/api/query", json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    with open("scratch/exam_response.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Response written to scratch/exam_response.json")
except Exception as e:
    print(f"Error querying API: {e}")
