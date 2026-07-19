#!/bin/bash

# Terminate all background jobs if this script is stopped or interrupted
trap 'kill 0' SIGINT SIGTERM EXIT

echo "🚀 Starting all MediSync AI services concurrently in a single terminal..."

# 1. Start Python AI Service on port 8000
if [ -d "apps/ai-service/venv" ]; then
  echo "🤖 Starting AI Service (FastAPI) on port 8000..."
  (cd apps/ai-service && source venv/bin/activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000) &
else
  echo "⚠️  AI Service venv not found. AI features will not be available."
fi

# 2. Start Node.js workspace (Backend on port 3000, Frontend on port 3001)
echo "🌐 Starting Node.js workspace..."
npm run dev

# Wait for all background processes
wait
