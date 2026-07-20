#!/usr/bin/env zsh
# ============================================================
# dbgpt-start: 在旧版 Next.js UI 与迁移中的 shell 之间安全切换
#
# 安装: cp scripts/dbgpt-start.sh ~/.local/bin/dbgpt-start && chmod +x ~/.local/bin/dbgpt-start
# ============================================================
set -euo pipefail

PROJECT_DIR="/Users/hose/Documents/db-gpt/DB-GPT"
cd "$PROJECT_DIR"

# ── 1. 检查环境变量 ──
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  print -u2 "✗ OPENAI_API_KEY is not set. Add it to ~/.zshrc or export it."
  exit 1
fi

# ── 2. 端口清理 ──
BACKEND_PORT="${DBGPT_PORT:-5670}"

kill_port() {
  local port=$1
  local pids=($(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true))
  if (( ${#pids} > 0 )); then
    print "→ Port ${port} occupied by PID(s): ${pids[*]}, killing..."
    kill ${pids} 2>/dev/null || true
    sleep 1
    pids=($(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true))
    if (( ${#pids} > 0 )); then
      print "→ Force killing PID(s): ${pids[*]}..."
      kill -9 ${pids} 2>/dev/null || true
      sleep 0.5
    fi
  fi
}
kill_port "$BACKEND_PORT"

# ── 3. 选择前端（只读现有产物，不构建、不复制、不删除） ──
CONFIG_FILE="configs/dbgpt-proxy-openai.toml"
UI_MODE="${DBGPT_WEB_UI_MODE:-legacy}"
LEGACY_WEB_DIR="packages/dbgpt-app/src/dbgpt_app/static/legacy_web"
SHELL_WEB_DIR="packages/dbgpt-app/src/dbgpt_app/static/web"

case "$UI_MODE" in
  legacy)
    if [[ ! -f "$LEGACY_WEB_DIR/index.html" || ! -d "$LEGACY_WEB_DIR/_next/static" ]]; then
      print -u2 "✗ Legacy web UI assets are missing: $LEGACY_WEB_DIR"
      exit 1
    fi
    print "✓ UI mode: legacy ($LEGACY_WEB_DIR)"
    ;;
  shell)
    if [[ ! -f "$SHELL_WEB_DIR/index.html" || ! -d "$SHELL_WEB_DIR/assets" ]]; then
      print -u2 "✗ Shell web UI assets are missing: $SHELL_WEB_DIR"
      exit 1
    fi
    print "✓ UI mode: shell ($SHELL_WEB_DIR)"
    ;;
  *)
    print -u2 "✗ DBGPT_WEB_UI_MODE must be legacy or shell"
    exit 1
    ;;
esac

export DBGPT_WEB_UI_MODE="$UI_MODE"

# ── 4. 启动后端 ──
export DBGPT_AUTH_TYPE=db  # 启用数据库权限认证（v0.8.2+）
export DBGPT_LOG_LEVEL=WARNING  # 只输出WARNING及以上级别日志
print "🚀 启动 DB-GPT webserver on port ${BACKEND_PORT}..."
exec .venv/bin/dbgpt start webserver --config "$CONFIG_FILE"
# #!/usr/bin/env zsh
# # ============================================================
# # dbgpt-start: 生产模式启动（增量前端构建）
# #
# # 安装: cp scripts/dbgpt-start.sh ~/.local/bin/dbgpt-start && chmod +x ~/.local/bin/dbgpt-start
# # ============================================================
# set -euo pipefail

# PROJECT_DIR="/Users/hose/Documents/db-gpt/DB-GPT"
# cd "$PROJECT_DIR"

# # ── 1. 检查环境变量 ──
# if [[ -z "${OPENAI_API_KEY:-}" ]]; then
#   print -u2 "✗ OPENAI_API_KEY is not set. Add it to ~/.zshrc or export it."
#   exit 1
# fi

# # ── 2. 端口清理（后端 + 前端） ──
# BACKEND_PORT="${DBGPT_PORT:-5670}"
# FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# kill_port() {
#   local port=$1
#   local pids=($(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true))
#   if (( ${#pids} > 0 )); then
#     print "→ Port ${port} occupied by PID(s): ${pids[*]}, killing..."
#     kill ${pids} 2>/dev/null || true
#     sleep 1
#     # Force kill if still alive
#     pids=($(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true))
#     if (( ${#pids} > 0 )); then
#       print "→ Force killing PID(s): ${pids[*]}..."
#       kill -9 ${pids} 2>/dev/null || true
#       sleep 0.5
#     fi
#   fi
# }

# kill_port "$BACKEND_PORT"
# kill_port "$FRONTEND_PORT"

# # ── 3. 增量前端构建（仅源码变化时重建） ──
# STATIC_DIR="packages/dbgpt-app/src/dbgpt_app/static/web"
# BUILD_MARKER="$STATIC_DIR/.build_ts"

# need_build=false
# if [[ ! -d "$STATIC_DIR" || ! -f "$BUILD_MARKER" ]]; then
#   need_build=true
# else
#   last_build=$(cat "$BUILD_MARKER")
#   # Find newest source file modification time
#   newest=$(find web -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' -o -name '*.json' \) \
#     ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/out/*' \
#     -exec stat -f '%m' {} + 2>/dev/null | sort -rn | head -1)
#   if [[ -n "$newest" && "$newest" -gt "$last_build" ]]; then
#     need_build=true
#   fi
# fi

# if $need_build; then
#   print "🔨 Frontend files changed, rebuilding..."
#   bash scripts/build_web_static.sh
#   mkdir -p "$STATIC_DIR"
#   date '+%s' > "$BUILD_MARKER"
#   print "✓ Frontend build complete."
# else
#   print "✅ Frontend unchanged, skipping build."
# fi

# # ── 4. 启动后端 ──
# print "🚀 Starting DB-GPT webserver on port ${BACKEND_PORT}..."
# exec .venv/bin/dbgpt start webserver --config configs/dbgpt-proxy-openai.toml
