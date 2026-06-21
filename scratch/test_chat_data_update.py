import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'llm_service'))

from database import update_user_total_tokens, supabase

# Let's search for a chat_id in chat_data
try:
    response = supabase.table("chat_data").select("*").limit(1).execute()
    if response and hasattr(response, 'data') and len(response.data) > 0:
        existing = response.data[0]
        chat_id = existing["chat_id"]
        print(f"Found existing chat_id: {chat_id}")
        print(f"Current columns in chat_data: {list(existing.keys())}")
        print(f"Current total_tokens: {existing.get('total_tokens')}")
        
        # Test update_user_total_tokens
        print("Updating total tokens...")
        update_user_total_tokens(chat_id, 100)
        
        # Verify
        response2 = supabase.table("chat_data").select("total_tokens").eq("chat_id", chat_id).execute()
        print(f"New total_tokens in chat_data: {response2.data[0].get('total_tokens')}")
    else:
        print("No chat_data rows found.")
except Exception as e:
    print(f"Error in chat_data test: {e}")
