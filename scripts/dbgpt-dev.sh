#!/usr/bin/env zsh
# ============================================================
# dbgpt-dev: 前后端分离开发模式
#
# 用法:
#   ./scripts/dbgpt-dev.sh           # 启动后端 + 前端 dev server
#   ./scripts/dbgpt-dev.sh backend   # 仅启动后端
#   ./scripts/dbgpt-dev.sh frontend  # 仅启动前端 dev server
# ============================================================
set -euo pipefail

PROJECT_DIR="/Users/hose/Documents/db-gpt/DB-GPT"
cd "$PROJECT_DIR"

BACKEND_PORT="${DBGPT_PORT:-5670}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

start_backend() {
  if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    print -u2 "${RED}✗ OPENAI_API_KEY is not set.${NC}"
    exit 1
  fi

  # Kill existing backend on port
  local pids=($(lsof -tiTCP:"${BACKEND_PORT}" -sTCP:LISTEN 2>/dev/null || true))
  if (( ${#pids} > 0 )); then
    print "${BLUE}→ Killing existing process on port ${BACKEND_PORT}...${NC}"
    kill ${pids} 2>/dev/null || true
    sleep 1
  fi

  print "${GREEN}✓ Starting backend on port ${BACKEND_PORT}...${NC}"
  .venv/bin/dbgpt start webserver --profile openai &
  BACKEND_PID=$!
  print "${GREEN}✓ Backend PID: ${BACKEND_PID}${NC}"
}

start_frontend() {
  # Kill existing frontend on port
  local pids=($(lsof -tiTCP:"${FRONTEND_PORT}" -sTCP:LISTEN 2>/dev/null || true))
  if (( ${#pids} > 0 )); then
    print "${BLUE}→ Killing existing process on port ${FRONTEND_PORT}...${NC}"
    kill ${pids} 2>/dev/null || true
    sleep 1
  fi

  print "${GREEN}✓ Starting frontend dev server on port ${FRONTEND_PORT}...${NC}"
  print "${GREEN}  → http://localhost:${FRONTEND_PORT}${NC}"
  print "${BLUE}  → API proxied to http://127.0.0.1:${BACKEND_PORT}${NC}"
  print ""
  cd "$PROJECT_DIR/web"
  # 16GB heap is too much for 8GB machines; use 4GB (adjust via NODE_HEAP_MB env var)
  # NOTE: Turbopack (--turbo) is NOT compatible with this project on Next 13.4.7
  # because we rely on experimental.esmExternals / trailingSlash / skipTrailingSlashRedirect.
  # TURBO=1 will fail immediately. Keep webpack.
  if [[ "${TURBO:-0}" == "1" ]]; then
    print "${RED}⚠ TURBO=1 requested but Turbopack is incompatible with this project's next.config.js${NC}"
    print "${RED}   (esmExternals / trailingSlash / skipTrailingSlashRedirect not supported by Turbopack yet)${NC}"
    print "${BLUE}→ Falling back to webpack.${NC}"
  fi
  # Prefer yarn (project's declared package manager) which auto-loads package.json NODE_OPTIONS.
  # NODE_HEAP_MB overrides via env; defaults to 4096 (safe for 8GB machines).
  if command -v yarn >/dev/null 2>&1; then
    NODE_OPTIONS="--max_old_space_size=${NODE_HEAP_MB:-4096}" yarn dev &
  else
    NODE_OPTIONS="--max_old_space_size=${NODE_HEAP_MB:-4096}" npx next dev &
  fi
  FRONTEND_PID=$!
  cd "$PROJECT_DIR"
}

cleanup() {
  print "\n${BLUE}→ Shutting down...${NC}"
  [[ -n "${BACKEND_PID:-}" ]] && kill $BACKEND_PID 2>/dev/null
  [[ -n "${FRONTEND_PID:-}" ]] && kill $FRONTEND_PID 2>/dev/null
  wait 2>/dev/null
  print "${GREEN}✓ Done.${NC}"
}

trap cleanup EXIT INT TERM

MODE="${1:-all}"

case "$MODE" in
  backend)
    start_backend
    wait $BACKEND_PID
    ;;
  frontend)
    start_frontend
    wait $FRONTEND_PID
    ;;
  all|*)
    print "${GREEN}╔══════════════════════════════════════════╗${NC}"
    print "${GREEN}║   DB-GPT Dev Mode (前后端分离)           ║${NC}"
    print "${GREEN}╚══════════════════════════════════════════╝${NC}"
    print ""
    start_backend
    sleep 2  # Give backend time to start
    start_frontend
    print ""
    print "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    print "${GREEN}  Backend:  http://localhost:${BACKEND_PORT}${NC}"
    print "${GREEN}  Frontend: http://localhost:${FRONTEND_PORT}  ← 浏览器访问这个${NC}"
    print "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    print "${BLUE}  Ctrl+C 停止所有服务${NC}"
    print ""
    wait
    ;;
esac
