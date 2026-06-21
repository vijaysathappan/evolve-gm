import requests

payload = {
    "query": "i wanted to learn more on physics chapter 1",
    "chat_data_id": "",
    "user_id": ""
}

try:
    response = requests.post("http://localhost:8000/api/query", json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print("Response: ", response.text)
except Exception as e:
    print(f"Error querying API: {e}")
