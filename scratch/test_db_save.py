import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'llm_service'))

from database import save_message_to_session, supabase

# Let's print Supabase URL to make sure we are connecting
print(f"Supabase URL: {os.getenv('SUPABASE_URL')}")

# Try to fetch one chat message row first to get a valid session ID
try:
    response = supabase.table("chat_messages").select("*").limit(1).execute()
    if response and hasattr(response, 'data') and len(response.data) > 0:
        existing = response.data[0]
        session_uuid = existing["id"]
        print(f"Found existing session ID: {session_uuid}")
        print(f"Current columns in chat_messages: {list(existing.keys())}")
        print(f"Current total_tokens: {existing.get('total_tokens')}")
        
        # Now try to save a message and trace what happens
        tokens = {
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30
        }
        print("Saving message to session...")
        res = save_message_to_session(session_uuid, "test query", "test response", tokens=tokens)
        print(f"Save message result: {res}")
        
        # Fetch again to verify total_tokens is updated
        response2 = supabase.table("chat_messages").select("total_tokens").eq("id", session_uuid).execute()
        print(f"New total_tokens in DB: {response2.data[0].get('total_tokens')}")
        
    else:
        print("No sessions found in chat_messages table.")
except Exception as e:
    print(f"Error querying/updating database: {e}")
