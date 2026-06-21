import tiktoken

try:
    # Use gpt-4o encoding (cl100k_base or o200k_base)
    # tiktoken.encoding_for_model("gpt-4o-mini") will use cl100k_base or o200k_base depending on tiktoken version
    try:
        encoding = tiktoken.encoding_for_model("gpt-4o-mini")
    except Exception:
        encoding = tiktoken.get_encoding("cl100k_base")
        
    text = "Hello! I am your Evolve Master Teacher. How can I assist you with your prep today?"
    tokens = encoding.encode(text)
    print(f"Text: '{text}'")
    print(f"Token count: {len(tokens)}")
    print(f"Tokens: {tokens}")
except Exception as e:
    print(f"Error: {e}")
