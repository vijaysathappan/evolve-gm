import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load root .env from one directory up
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")

if not url or not key:
    print("[DB ERROR] Supabase credentials not found in environment.")

supabase: Client = create_client(url, key)

def get_session_history(session_uuid: str):
    """Fetches the conversation history for a specific session row in chat_messages."""
    try:
        # Use simple select().eq() to avoid maybe_single() issues if schema cache is stale
        response = supabase.table("chat_messages").select("content").eq("id", session_uuid).execute()
        if response and hasattr(response, 'data') and len(response.data) > 0:
            return response.data[0].get("content") or []
        return []
    except Exception as e:
        print(f"Error fetching session history: {e}")
        return []

def get_user_chat_id(user_uuid: str):
    """Retrieves the root chat_id from chat_data for a given user."""
    try:
        response = supabase.table("chat_data").select("chat_id").eq("user_id", user_uuid).execute()
        if response and hasattr(response, 'data') and len(response.data) > 0:
            return response.data[0].get("chat_id")
        return None
    except Exception as e:
        print(f"Error fetching user chat_id: {e}")
        return None

def save_message_to_session(session_uuid: str, query: str, response_text: str, user_id: str = None):
    """Appends to history or creates session. Handles 'session_id' and avoiding stale schema cache issues."""
    try:
        # 1. Fetch existing session data
        response = supabase.table("chat_messages").select("*").eq("id", session_uuid).execute()
        existing = response.data[0] if response and hasattr(response, 'data') and len(response.data) > 0 else None
        
        # 2. Extract current history and parent chat_id
        history = existing.get("content", []) if existing and existing.get("content") else []
        parent_chat_id = existing.get("session_id") if existing else None
        
        # 3. If new row, resolve parent chat_id
        if not parent_chat_id and user_id:
            parent_chat_id = get_user_chat_id(user_id)
            
        # 4. Prepare updated content
        new_pair = {"query": query, "response": response_text}
        updated_history = (history or []) + [new_pair]
        
        # 5. Build payload
        payload = {
            "id": session_uuid,
            "content": updated_history
        }
        
        if parent_chat_id:
            payload["session_id"] = parent_chat_id
            
        # 6. Upsert to the database
        supabase.table("chat_messages").upsert(payload).execute()
        
        return True
    except Exception as e:
        print(f"Error saving to database: {e}")
        return False
