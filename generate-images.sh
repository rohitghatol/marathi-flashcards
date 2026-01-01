#!/bin/bash

# Configuration
SCRIPT_PATH="./scripts/generate_images.py"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed."
    exit 1
fi

# Check if the API Key is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY environment variable is not set."
    echo "Please set it using: export GEMINI_API_KEY='your_key_here'"
    exit 1
fi

# Run the generation script
echo "🎨 Starting Marathi Flashcard Image Generation..."
python3 "$SCRIPT_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Image generation complete!"
else
    echo "❌ Image generation failed."
fi
