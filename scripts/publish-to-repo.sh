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
git clone --branch "$DEST_BRANCH" --single-branch "$DEST_REPO" "$TMP" 2>/dev/null || {
  # 如果分支不存在，克隆默认分支然后创建新分支
  git clone "$DEST_REPO" "$TMP"
  cd "$TMP"
  git checkout --orphan "$DEST_BRANCH" 2>/dev/null || git switch --orphan "$DEST_BRANCH"
}

cd "$TMP"

# 确保在正确的分支上
if git show-ref --verify --quiet "refs/heads/$DEST_BRANCH"; then
  git switch "$DEST_BRANCH"
else
  git switch --orphan "$DEST_BRANCH"
fi

echo "==> 拉取远程最新更改..."
git pull origin "$DEST_BRANCH" --allow-unrelated-histories --no-edit || echo "初始推送，无需拉取"

# 清空工作区（保留 .git）
echo "==> 清空工作区..."
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

echo "==> 同步 _site 内容..."
rsync -av --delete --exclude ".git" "$ROOT/_site/" "./"

# 防止 GitHub 对下划线目录特殊处理
touch .nojekyll

# 可选：带上自定义域名
[ -f "$ROOT/CNAME" ] && cp "$ROOT/CNAME" "./"

git add -A

# 检查是否有更改要提交
if git diff-index --quiet HEAD --; then
  echo "✅ 没有更改需要提交"
else
  git commit -m "Publish static site $(date -u +'%F %T UTC')"
  echo "==> 推送到远程..."
  git push -u origin "$DEST_BRANCH" --force-with-lease
  echo "✅ 已发布到 $DEST_REPO ($DEST_BRANCH)"
fi

echo "Baseurl used: '$BASEURL'"

# 清理临时目录
rm -rf "$TMP"
