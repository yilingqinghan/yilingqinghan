#!/usr/bin/env bash
set -euo pipefail

# === 可配置 ===
DEST_REPO="${1:-git@github.com:yilingqinghan/yilingqinghan.git}"  # 目标仓库（只放构建产物）
DEST_BRANCH="${2:-pages-dist}"                                    # 目标分支（不要用 main）
BASEURL="${3:-/yilingqinghan}"                                    # Pages 项目页建议用 /仓库名；只做存档可传 ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Build _site ..."
bundle exec jekyll clean
JEKYLL_ENV=production bundle exec jekyll build --baseurl "$BASEURL"

TMP="$(mktemp -d)"
echo "==> Clone $DEST_REPO -> $TMP"
git clone --depth 1 "$DEST_REPO" "$TMP"

cd "$TMP"
# 切换/创建目标分支
if git show-ref --verify --quiet "refs/heads/$DEST_BRANCH"; then
  git switch "$DEST_BRANCH"
else
  git switch --orphan "$DEST_BRANCH"
fi

# 清空工作区（保留 .git）
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

echo "==> Sync _site -> $DEST_BRANCH (exclude .git)"
# 注意：一定要排除 .git
rsync -av --delete --exclude ".git" "$ROOT/_site/" "./"

# 防止 GitHub 对下划线目录特殊处理
touch .nojekyll

# 可选：带上自定义域名
[ -f "$ROOT/CNAME" ] && cp "$ROOT/CNAME" "./"

git add -A
git commit -m "Publish static site $(date -u +'%F %T UTC')" || echo "Nothing to commit"
git push -u origin "$DEST_BRANCH"

echo "✅ Published to $DEST_REPO ($DEST_BRANCH)"
echo "   Baseurl used: '$BASEURL'"
