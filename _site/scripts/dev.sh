# 0) 先停掉当前进程（如果在跑）：按 Ctrl + C

# 1) 把仓库从百度网盘目录搬到一个干净的 ASCII 路径（无空格/中文）
cd ~
mkdir -p ~/work
rsync -a --delete --exclude 'vendor/bundle' \
  "/Users/yilingqinghan/Documents/百度网盘同步/Mac本机同步/工程/academicpages.github.io/" \
  ~/work/academicpages

cd ~/work/academicpages

# 2) 清掉旧的 bundler 缓存与锁（防同步盘遗留的半成品）
rm -rf vendor/bundle .bundle Gemfile.lock

# 3) 安装必要工具（若没装过）
# 若 ruby 命令不存在：  brew install ruby@3.2  &&  echo 'export PATH="/opt/homebrew/opt/ruby@3.2/bin:$PATH"' >> ~/.zshrc && exec $SHELL

# 4) 配置 bundler（镜像 + 加速）
bundle config set --local path vendor/bundle
bundle config set --local without 'development test'
bundle config set --local clean 'true'
bundle config set --local jobs 4
bundle config set --local retry 3
bundle config set --local timeout 15
bundle config set mirror.https://rubygems.org https://gems.ruby-china.com

# 5) macOS 原生扩展常用的工具链（没装会弹窗提示装）
xcode-select -p >/dev/null 2>&1 || xcode-select --install

# 6) 尽量用预编译二进制，避免本机编译
export NOKOGIRI_USE_PRECOMPILED=true

# 7) 安装依赖（先 full-index 更稳；失败会重试降级一次）
bundle install --no-doc --full-index || bundle install --no-doc --verbose

# 8) 起服务
bundle exec jekyll serve --host 0.0.0.0 --port 4000 --livereload

