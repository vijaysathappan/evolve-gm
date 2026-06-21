import requests

payload = {
    "userId": "b91ceb7f-0ef7-4d3e-91dc-8ec0c20a0cc6"
}

try:
    print("Sending POST request to http://localhost:5000/api/chat/new...")
    r = requests.post("http://localhost:5000/api/chat/new", json=payload, timeout=10)
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error calling API: {e}")
