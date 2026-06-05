#!/bin/bash

# Payroll Management App Unified Launcher

# Terminate all child processes on Ctrl+C
trap cleanup SIGINT SIGTERM

cleanup() {
  echo ""
  echo "Shutting down servers..."
  if [ ! -z "$BACKEND_PID" ]; then
    echo "Stopping FastAPI backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
  fi
  if [ ! -z "$FRONTEND_PID" ]; then
    echo "Stopping React Vite frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
  fi
  exit 0
}

# Resolve directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "Payroll Management System Launch Control"
echo "=========================================================="

# 1. Start Backend FastAPI Server
echo ">>> Starting Backend FastAPI server..."
cd "$DIR/backend"
if [ ! -d "venv" ]; then
  echo "Backend virtualenv not found. Running setup..."
  /usr/bin/python3.12 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend running in background with PID: $BACKEND_PID"

# 2. Start Frontend Vite React Dev Server
echo ">>> Starting Frontend Vite server..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "Frontend node_modules not found. Running npm install..."
  npm install
fi
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
echo "Frontend running in background with PID: $FRONTEND_PID"

echo "=========================================================="
echo "  FastAPI Backend: http://localhost:8000"
echo "  Vite React UI:   http://localhost:5173"
echo "=========================================================="
echo "Press Ctrl+C to terminate both servers."
echo ""

# Keep shell open and print logs
wait
