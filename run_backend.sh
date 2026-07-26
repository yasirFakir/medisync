#!/bin/bash
# MediSync Development Launcher
# Runs both AI Microservice (Port 8000) and Express Backend (Port 3001) in current terminal with unbuffered output

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Trap Ctrl+C (SIGINT) to kill child background processes on exit
trap 'kill $(jobs -p) 2>/dev/null' SIGINT SIGTERM EXIT

echo "🚀 Starting MediSync Stack in current terminal..."
echo "  [AI-SERVICE] FastAPI on http://127.0.0.1:8000"
echo "  [BACKEND]    Express on http://127.0.0.1:3001 (or PORT setting)"
echo "Press Ctrl+C to stop both servers."
echo "----------------------------------------------------------------------"

# Force unbuffered output for Python & Node
export PYTHONUNBUFFERED=1
export FORCE_COLOR=1

# 1. Start Python AI Service on port 8000
(
  cd "$PROJECT_DIR/apps/ai-service" || exit
  if [ -d "venv" ]; then
    source venv/bin/activate
  fi
  python main.py 2>&1 | sed 's/^/[AI-SERVICE] /'
) &

# 2. Start Express Node.js Backend on port 3001
(
  cd "$PROJECT_DIR/apps/backend" || exit
  npm run dev 2>&1 | sed 's/^/[BACKEND] /'
) &

# Wait for background jobs
wait
