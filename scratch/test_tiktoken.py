try:
    import tiktoken
    print("tiktoken is installed successfully!")
except ImportError as e:
    print(f"tiktoken is NOT installed: {e}")
