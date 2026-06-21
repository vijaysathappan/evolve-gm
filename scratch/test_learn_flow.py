import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_learn_flow():
    print("Testing /api/learn/generate...")
    try:
        res = requests.post(
            f"{BASE_URL}/api/learn/generate",
            json={"subject": "Physics", "chapter": "Class 11 Chapter 1"},
            timeout=10
        )
        print("Status code:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            print("Chapter Title:", data.get("chapter_title"))
            print("PDF URL:", data.get("pdf_url"))
            sections = data.get("sections", [])
            print("Number of sections found:", len(sections))
            if sections:
                first_sec = sections[0]
                print("First section title:", first_sec.get("title"))
                print("First section raw_text (truncated):", first_sec.get("raw_text")[:100] if first_sec.get("raw_text") else "None")
                
                # Test explain-section
                print("\nTesting /api/learn/explain-section...")
                explain_res = requests.post(
                    f"{BASE_URL}/api/learn/explain-section",
                    json={
                        "section_title": first_sec.get("title"),
                        "raw_text": first_sec.get("raw_text"),
                        "user_id": "sandeep_s",
                        "subject": "Physics",
                        "chapter": "Class 11 Chapter 1",
                        "sections": sections,
                        "active_idx": 0
                    },
                    timeout=45
                )
                print("Explain status:", explain_res.status_code)
                if explain_res.status_code == 200:
                    explain_data = explain_res.json()
                    explanations = explain_data.get("explanations", [])
                    print("Explanations count:", len(explanations))
                    if explanations:
                        print("Sample Explanation Object:", json.dumps(explanations[0], indent=2))
                else:
                    print("Explain failed:", explain_res.text)
        else:
            print("Generate failed:", res.text)
            
    except Exception as e:
        print("Test error:", e)

if __name__ == "__main__":
    test_learn_flow()
