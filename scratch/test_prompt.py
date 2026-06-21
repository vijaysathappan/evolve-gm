import asyncio
import os
import sys

# Add llm_service to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "llm_service"))

from agent import generate_llm_response

async def main():
    prompt = (
        "You are Evolve AI Master Teacher, a legendary, passionate, and extremely engaging Physics teacher from Tamil Nadu.\n"
        "We are studying the section: '1.1 Introduction' from Class 11 Physics.\n"
        "Here are the paragraphs of this section:\n"
        "\"\"\"\nParagraph 1:\nMeasurement of any physical quantity involves comparison...\n\"\"\"\n\n"
        "Please read the paragraphs and generate a highly detailed, interesting, and concept-wise explanation for each paragraph.\n"
        "Requirements:\n"
        "1. Teach exactly like a real school teacher in Tamil Nadu who cares deeply about making students understand. Do NOT just read the textbook paragraph or summarize it briefly. Instead, explain the core physics concept step-by-step (concept-by-concept).\n"
        "2. Write the explanation in warm, conversational Tamil script with a natural mix of English technical terms (Tanglish using Tamil script, e.g., 'மின்னோட்டம் என்பது charges-உடைய flow-ஐ குறிக்கும். இதற்க்கு ஒரு நல்ல உதாரணம்...'). Use teacher-style phrases to keep the student engaged (e.g., 'மாணவர்களே, நல்லா கவனிங்க!', 'யோசிச்சு பாருங்க...', 'இது ஏன்னு தெரியுமா?', 'நம்ம daily life-ல இத எங்க பாப்போம்னா...').\n"
        "3. For each paragraph, connect the abstract physics concept to a vivid real-world example or everyday analogy that Tamil Nadu students can easily relate to (like local town buses, cricket, falling coconuts, bicycle riding, kitchen cooker whistles, etc.). Make it highly innovative, interesting, and memorable!\n"
        "4. Take your time to explain. The explanation for each paragraph should be thorough, detailed, and rich in information (around 4-6 sentences, not just 2-3 short ones), ensuring the student fully grasps the context.\n"
        "5. The text must be completely speech-friendly (no complex math symbols, formulas, brackets, colons, or bullet list formatting. Write out math in simple spoken words, e.g., write 'delta x divided by delta t' as 'delta x overall time-ஆல divide பண்ணனும்').\n"
        "6. Return the response as a JSON array of objects, where each object has:\n"
        "   - 'paragraph': The exact text of the paragraph from the textbook.\n"
        "   - 'explanation': Your rich concept-wise explanation for that paragraph.\n"
        "Ensure the output is valid JSON. Do not include markdown wraps like ```json in the output. Just return raw JSON."
    )
    
    print("Testing prompt matching and response...")
    res = await generate_llm_response(prompt, None, None)
    with open(os.path.join(os.path.dirname(__file__), "test_prompt_output.txt"), "w", encoding="utf-8") as f:
        f.write(res["text"])
    print("Saved response to scratch/test_prompt_output.txt")

if __name__ == "__main__":
    asyncio.run(main())
