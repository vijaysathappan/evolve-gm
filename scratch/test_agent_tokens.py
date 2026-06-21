import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'llm_service'))

from agent import get_dynamic_token_limit, count_messages_tokens, count_tokens

# 1. Test get_dynamic_token_limit
queries = [
    "hi",
    "Explain quantum mechanics.",
    "solve x + 2 = 5",
    "Who are you?",
    "give me a detailed study plan for chemistry",
    "this is a very long query that has more than eight words in it to test length logic"
]

print("=== Testing get_dynamic_token_limit ===")
for q in queries:
    limit = get_dynamic_token_limit(q)
    print(f"Query: '{q}' -> Limit: {limit}")

# 2. Test count_messages_tokens
messages = [
    {"role": "system", "content": "You are Evolve Master Teacher. Keep under 150 tokens."},
    {"role": "user", "content": "hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "Explain gravity"}
]

print("\n=== Testing count_messages_tokens ===")
msg_tokens = count_messages_tokens(messages)
print(f"Messages tokens: {msg_tokens}")

# 3. Test count_tokens
text = "Hi there!"
print(f"Simple text: '{text}' -> {count_tokens(text)} tokens")
