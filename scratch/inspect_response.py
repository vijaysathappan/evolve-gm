import json

with open("scratch/exam_response.json", "r", encoding="utf-8") as f:
    data = json.load(f)

text_content = data.get("text", "")
with open("scratch/inspect_output.txt", "w", encoding="utf-8") as out:
    out.write(text_content)
print("Wrote text content to scratch/inspect_output.txt successfully!")
