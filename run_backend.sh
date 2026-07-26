#!/bin/bash
# MediSync Development Launcher
# Runs both AI Service (port 8000) and Express Backend (port 3000) concurrently in the CURRENT terminal window!

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Trap Ctrl+C (SIGINT) to clean up all background jobs on exit
trap 'kill 0' SIGINT SIGTERM EXIT

echo "🚀 Starting MediSync Stack in CURRENT terminal window..."
echo "  - AI Microservice (FastAPI / Python) on http://127.0.0.1:8000"
echo "  - Main Backend   (Express / Node.js) on http://127.0.0.1:3000"
echo "Press Ctrl+C at any time to stop both servers."
echo ""

# 1. Start Python AI Service on port 8000
(
  cd "$PROJECT_DIR/apps/ai-service" || exit
  if [ -d "venv" ]; then
    source venv/bin/activate
  fi
  python main.py
) &

# 2. Start Express Node.js Backend on port 3000
(
  cd "$PROJECT_DIR/apps/backend" || exit
  npm run dev
) &

# Wait for both background processes in current terminal
wait
