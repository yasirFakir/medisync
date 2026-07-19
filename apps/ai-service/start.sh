#!/bin/bash
# Move to the directory where this script is located
cd "$(dirname "$0")"

# Activate python virtual environment and run the uvicorn server
if [ -d "venv" ]; then
  echo "🚀 Activating virtual environment and starting AI Service..."
  source venv/bin/activate
  python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
else
  echo "❌ Virtual environment (venv) not found in apps/ai-service/. Please setup the venv first."
  exit 1
fi
