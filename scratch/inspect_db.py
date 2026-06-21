import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(url, key)

print("Fetching one row from users_data:")
try:
    res = supabase.table("users_data").select("*").limit(1).execute()
    print("users_data schema:", res.data[0].keys() if res.data else "No rows found")
    if res.data:
        print("users_data row:", res.data[0])
except Exception as e:
    print("users_data query failed:", e)

print("-" * 50)

print("Fetching one row from chat_data:")
try:
    res = supabase.table("chat_data").select("*").limit(1).execute()
    print("chat_data schema:", res.data[0].keys() if res.data else "No rows found")
    if res.data:
        print("chat_data row:", res.data[0])
except Exception as e:
    print("chat_data query failed:", e)

print("-" * 50)

print("Fetching one row from chat_messages:")
try:
    res = supabase.table("chat_messages").select("*").limit(1).execute()
    print("chat_messages schema:", res.data[0].keys() if res.data else "No rows found")
    if res.data:
        print("chat_messages row:", res.data[0])
except Exception as e:
    print("chat_messages query failed:", e)
