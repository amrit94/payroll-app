#!/bin/bash
# Resolve current script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Setting up Python virtual environment..."
cd ~/.virtualenvs/
/usr/bin/python3.12 -m venv prmenv

echo "Activating virtual environment..."
source ~/.virtualenvs/prmenv/bin/activate

echo "Installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Starting FastAPI backend server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# kill -9 $(lsof -t -i:8000)