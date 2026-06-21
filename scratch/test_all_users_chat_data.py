import os
import dotenv
import supabase

dotenv.load_dotenv()
s = supabase.create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))

users = s.table('users_data').select('id, user_id, name').execute().data
print("=== Checking chat_data mapping for each user ===")
for u in users:
    chat_rows = s.table('chat_data').select('*').eq('user_id', u['id']).execute().data
    print(f"User: '{u['name']}' ({u['user_id']}) ID: {u['id']} -> chat_data rows: {len(chat_rows)}")
    if chat_rows:
        print(f"   chat_id: {chat_rows[0]['chat_id']}")
