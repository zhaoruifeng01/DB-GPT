#!/usr/bin/env zsh
# ============================================================
# dbgpt-start: 生产模式启动（增量 shell 前端构建 + 依赖缓存）
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
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

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
kill_port "$FRONTEND_PORT"

# ── 3. 增量前端构建 ──
STATIC_DIR="packages/dbgpt-app/src/dbgpt_app/static/web"
SRC_MARKER="$STATIC_DIR/.src_ts"        # 源码最新 mtime
DEP_MARKER="$STATIC_DIR/.dep_hash"      # 依赖清单 hash
SHELL_DIR="web/shell"
SHELL_BUILD_DIR="$SHELL_DIR/build/client"

t0=$SECONDS

# 3a. 扫描 shell 产物会读取的源码和配置，排除构建输出与依赖目录
newest_src=$(find web -type f \
  \( -name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js' \
     -o -name '*.css' -o -name '*.scss' -o -name '*.less' -o -name '*.html' \) \
  ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/out/*' \
  ! -path '*/shell/build/*' ! -path '*/shell/.react-router/*' \
  ! -path '*/locales/*' \
  -exec stat -f '%m' {} + 2>/dev/null | sort -rn | head -1)

# 特殊：shell 构建配置也要看
newest_cfg=$(stat -f '%m' \
  web/shell/package.json web/shell/vite.config.ts web/shell/react-router.config.ts \
  web/shell/tailwind.config.ts web/shell/postcss.config.js \
  web/shared/package.json web/shared/src/index.ts 2>/dev/null | sort -rn | head -1)

newest=$(echo -e "${newest_src:-0}\n${newest_cfg:-0}" | sort -rn | head -1)

last_src=0
[[ -f "$SRC_MARKER" ]] && last_src=$(cat "$SRC_MARKER")

need_build=false
if [[ ! -f "$STATIC_DIR/index.html" || ! -d "$STATIC_DIR/assets" ]]; then
  print "🔨 Shell static output missing → full build"
  need_build=true
elif [[ "$newest" -gt "$last_src" ]]; then
  print "🔨 Source changed since last build"
  # Only try to list changed files if the marker actually exists;
  # `find -newer` on a missing file errors and would abort under `set -e`.
  if [[ -f "$SRC_MARKER" ]]; then
    changed=$(find web -type f \
      \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' -o -name '*.scss' \) \
      ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/out/*' \
      ! -path '*/shell/build/*' ! -path '*/shell/.react-router/*' \
      ! -path '*/locales/*' \
      -newer "$SRC_MARKER" 2>/dev/null | head -5 || true)
    if [[ -n "$changed" ]]; then
      print "   → top changed files:"
      print "$changed" | sed 's/^/     /'
    fi
  else
    print "   → first run (no marker yet)"
  fi
  need_build=true
fi

# 3b. 依赖变化检测（只有 package.json / lockfile 变了才重装）
dep_hash=$(cat package.json pnpm-lock.yaml web/shell/package.json web/shared/package.json 2>/dev/null | shasum | awk '{print $1}')
last_dep=""
[[ -f "$DEP_MARKER" ]] && last_dep=$(cat "$DEP_MARKER")
need_install=false
if [[ ! -d "web/shell/node_modules" ]]; then
  need_install=true
elif [[ "$dep_hash" != "$last_dep" ]]; then
  print "📦 Dependencies changed → pnpm install required"
  need_install=true
fi

if $need_build; then
  if $need_install; then
    print "📦 pnpm install..."
    pnpm install --filter @dbgpt/shell... 2>&1 | tail -6
  else
    print "✅ Dependencies unchanged, skipping install."
  fi

  print "🔨 react-router build..."
  pnpm --dir "$SHELL_DIR" run build

  rm -rf "$STATIC_DIR"
  mkdir -p "$STATIC_DIR"
  cp -R "$SHELL_BUILD_DIR"/. "$STATIC_DIR/"

  # 记录本次构建捕获到的最新 mtime（避免 marker 时间戳漂移 bug）
  echo "$newest" > "$SRC_MARKER"
  echo "$dep_hash" > "$DEP_MARKER"
  print "✓ Shell frontend rebuilt in $((SECONDS - t0))s."
else
  print "✅ Shell frontend unchanged, skipping build ($((SECONDS - t0))s check)."
fi

# ── 4. 启动后端 ──
export DBGPT_AUTH_TYPE=db  # 启用数据库权限认证（v0.8.2+）
export DBGPT_LOG_LEVEL=WARNING  # 只输出WARNING及以上级别日志
print "🚀 启动 DB-GPT webserver on port ${BACKEND_PORT}..."
exec .venv/bin/dbgpt start webserver --config configs/dbgpt-proxy-openai.toml
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
