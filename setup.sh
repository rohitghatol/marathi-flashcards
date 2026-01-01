#!/bin/bash

# Exit on error
set -e

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Updating pip and installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

if [ -z "$GEMINI_API_KEY" ]; then
    echo "Warning: GEMINI_API_KEY is not set in your environment."
    echo "Please run 'export GEMINI_API_KEY=your_key_here' before running the script."
else
    echo "Environment check: GEMINI_API_KEY is found."
fi

echo "Setup complete! Run 'source venv/bin/activate' to start."
