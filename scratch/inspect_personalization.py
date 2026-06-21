import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(url, key)

print("Fetching users_data for vijay_sathappan:")
try:
    res = supabase.table("users_data").select("*").eq("user_id", "vijay_sathappan").execute()
    if res.data:
        print("users_data:", res.data[0])
    else:
        print("No users_data row found for vijay_sathappan")
except Exception as e:
    print("users_data query failed:", e)

print("-" * 50)
print("Fetching user_personalization for vijay_sathappan:")
try:
    res = supabase.table("user_personalization").select("*").eq("id", "vijay_sathappan").execute()
    if res.data:
        print("user_personalization:", res.data[0])
    else:
        print("No user_personalization row found for vijay_sathappan")
except Exception as e:
    print("user_personalization query failed:", e)
