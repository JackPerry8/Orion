#!/usr/bin/env bash

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ██╗  ██╗██████╗  █████╗ ████████╗ ██████╗ ███████╗"
echo "  ██║ ██╔╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔════╝"
echo "  █████╔╝ ██████╔╝███████║   ██║   ██║   ██║███████╗"
echo "  ██╔═██╗ ██╔══██╗██╔══██║   ██║   ██║   ██║╚════██║"
echo "  ██║  ██╗██║  ██║██║  ██║   ██║   ╚██████╔╝███████║"
echo "  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝"
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Shut down cleanly on Ctrl+C ────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  # Kill the processes and their children
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && pkill -P "$BACKEND_PID"  2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && pkill -P "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Check for .env ─────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${YELLOW}Created .env from .env.example — add your API keys before continuing.${NC}"
  else
    echo -e "${RED}No .env file found. Create one before starting.${NC}"
    exit 1
  fi
fi

if grep -q "your_api_key_here" .env 2>/dev/null; then
  echo -e "${YELLOW}Warning: ANTHROPIC_API_KEY is not set in .env yet.${NC}"
  echo -e "You can save your key from the Settings page in the frontend."
fi

# ── Resolve Python ─────────────────────────────────────────────────────────
# Prefer the conda base env (where pyannote/whisper are installed),
# then fall back to whatever python3 is on PATH.
CONDA_BASE="$HOME/opt/anaconda3"
if [ -f "$CONDA_BASE/bin/python" ]; then
  PYTHON="$CONDA_BASE/bin/python"
elif command -v python3 &>/dev/null; then
  PYTHON="python3"
else
  echo -e "${RED}Python not found. Install Anaconda or Python 3.10+.${NC}"
  exit 1
fi

# ── Check other prerequisites ──────────────────────────────────────────────
check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}Error: '$1' not found.${NC} $2"
    exit 1
  fi
}

check_command node   "Install Node.js 18+ from https://nodejs.org"
check_command npm    "Install Node.js 18+ from https://nodejs.org"
check_command ffmpeg "brew install ffmpeg"

echo -e "${GREEN}✓ Prerequisites OK${NC}"

# ── Backend ────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}Installing Python dependencies...${NC}"
"$PYTHON" -m pip install -r backend/requirements.txt --quiet
echo -e "${GREEN}✓ Python dependencies ready${NC}"

echo -e "${CYAN}Starting backend...${NC}"
(cd backend && "$PYTHON" app.py) &
BACKEND_PID=$!

# Wait until the backend is actually accepting connections (up to 30 s)
echo -ne "${CYAN}Waiting for backend"
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/api/settings >/dev/null 2>&1; then
    echo -e " ${GREEN}ready${NC}"
    break
  fi
  echo -n "."
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo -e " ${RED}timed out${NC}"
    echo -e "${RED}Backend did not start. Check for errors above.${NC}"
    cleanup
  fi
done

# ── Frontend ───────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}Installing frontend dependencies...${NC}"
(cd frontend && npm install --silent)
echo -e "${GREEN}✓ Frontend dependencies ready${NC}"

echo -e "${CYAN}Starting frontend...${NC}"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Orion is running!"
echo -e "  Open ${CYAN}http://localhost:5173${GREEN} in your browser"
echo -e "  Backend API: ${CYAN}http://localhost:8000${GREEN}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Press Ctrl+C to stop both servers"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

wait
