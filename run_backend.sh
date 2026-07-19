#!/bin/bash
# Activating Python Virtual Environment and running uvicorn for AI service
# And concurrently running the Express Node.js backend to unify all logs in one terminal!

# Clean up all background jobs on exit (Ctrl+C)
trap 'kill 0' SIGINT SIGTERM EXIT

echo "🚀 Starting MediSync Unified Stack (FastAPI AI on port 8000 & Node.js Express on port 3000)..."

# 1. Start Python AI Service on port 8000
if [ -d "$(dirname "$0")/apps/ai-service" ]; then
  cd "$(dirname "$0")/apps/ai-service"
  if [ -d "venv" ]; then
    source venv/bin/activate
    python -m uvicorn main:app --host 127.0.0.1 --port 8000 &
  else
    echo "⚠️  AI Service venv not found. AI features will run with fallback."
  fi
  cd - > /dev/null
fi

# 2. Start Express Node.js Backend on port 3000
if [ -d "$(dirname "$0")/apps/backend" ]; then
  cd "$(dirname "$0")/apps/backend"
  npm run dev &
  cd - > /dev/null
fi

# Wait for both servers to run
wait
