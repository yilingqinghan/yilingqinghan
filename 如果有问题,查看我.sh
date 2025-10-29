# 1. 修复 Ruby 环境
brew uninstall ruby@3.2
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 2. 重新安装 Bundler
gem install bundler

# 3. 在项目目录中
bundle install
bundle exec jekyll serve
