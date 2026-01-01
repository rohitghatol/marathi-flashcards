import os
import json
import time
import io
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

# 1. Setup API Client
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("❌ Error: GEMINI_API_KEY not found.")
    exit(1)

# The new SDK handles the routing
client = genai.Client(api_key=API_KEY)

def generate_image(prompt, output_path):
    print(f"🎨 Generating: {prompt}")
    try:
        # We must tell the model to use 'IMAGE' as the response modality
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"]
            )
        )
        
        # Look for the image in the response parts
        for part in response.parts:
            if part.inline_data:
                # Use as_image() as you did, or save the bytes directly
                generated_img = part.as_image()
                generated_img.save(output_path)
                print(f"✅ Saved to {output_path.name}")
                return True
                
        print("⚠️ No image data found in response parts.")
        return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    # Resolve paths relative to where the script is
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent
    data_path = base_dir / "src" / "data" / "flashcards.json"
    public_dir = base_dir / "public"
    
    if not data_path.exists():
        print(f"❌ JSON not found at: {data_path}")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        flashcards = json.load(f)
    
    print(f"🚀 Starting batch generation for {len(flashcards)} cards...")
    
    for card in flashcards:
        prompt = card.get("imagePrompt")
        image_path_str = card.get("imagePath").lstrip("/")
        output_path = public_dir / image_path_str
        frozen = card.get("frozen", False)
        
        if frozen:
            print(f"❄️ Skipping {image_path_str} (Frozen)")
            continue

        if output_path.exists():
            continue
            
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Imagen 3 has a very strict Rate Limit (usually 1-2 images per minute)
        # We try once, then wait.
        if generate_image(prompt, output_path):
            # Wait 30 seconds between SUCCESSFUL images to avoid 429 errors
            time.sleep(35)
        else:
            # If it failed, wait 10 seconds before trying the next card
            time.sleep(10)

if __name__ == "__main__":
    main()