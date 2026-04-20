#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Cleanup on exit
cleanup() {
  echo ""
  echo "Stopping servers..."
  kill "$BE_PID" "$FE_PID" 2>/dev/null
  wait "$BE_PID" "$FE_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Backend
(
  cd "$ROOT/backend"
  while IFS= read -r line; do printf "\033[34m[BE]\033[0m %s\n" "$line"; done < <(
    .venv/bin/uvicorn app.main:app --reload --port 8000 2>&1
  )
) &
BE_PID=$!

# Frontend
(
  cd "$ROOT/frontend"
  while IFS= read -r line; do printf "\033[32m[FE]\033[0m %s\n" "$line"; done < <(
    npm run dev 2>&1
  )
) &
FE_PID=$!

echo "Backend  → http://localhost:8000  (auto-reload on Python changes)"
echo "Frontend → http://localhost:5173  (HMR on JSX/CSS changes)"
echo "Press Ctrl+C to stop both."
echo ""

wait "$BE_PID" "$FE_PID"
