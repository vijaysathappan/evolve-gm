import os
import sys
import requests
from supabase import create_client

# Load env
from dotenv import load_dotenv
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(url, key)

try:
    # 1. Fetch a valid session and user_id
    res = supabase.table("chat_messages").select("id, session_id, total_tokens").limit(1).execute()
    if res.data:
        session_uuid = res.data[0]["id"]
        chat_id = res.data[0]["session_id"]
        
        # Get user_id from chat_data
        res_user = supabase.table("chat_data").select("user_id").eq("chat_id", chat_id).single().execute()
        user_id = res_user.data["user_id"] if res_user.data else ""
        
        print(f"Testing with session_uuid: {session_uuid}, chat_id: {chat_id}, user_id: {user_id}")
        print(f"Current total_tokens in DB: {res.data[0]['total_tokens']}")
        
        # 2. Call the running API on port 8000
        payload = {
            "query": "explain quantum physics",
            "chat_data_id": session_uuid,
            "user_id": user_id
        }
        print("Sending query to http://localhost:8000/api/query...")
        r = requests.post("http://localhost:8000/api/query", json=payload)
        print(f"API status code: {r.status_code}")
        
        # 3. Fetch from DB again to verify tokens
        res2 = supabase.table("chat_messages").select("total_tokens, input_tokens, output_tokens").eq("id", session_uuid).single().execute()
        print(f"New total_tokens in DB: {res2.data.get('total_tokens')}")
        print(f"New input_tokens in DB: {res2.data.get('input_tokens')}")
        print(f"New output_tokens in DB: {res2.data.get('output_tokens')}")
    else:
        print("No sessions found.")
except Exception as e:
    print(f"Error: {e}")
