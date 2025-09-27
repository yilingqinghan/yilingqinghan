\
@echo off
setlocal ENABLEDELAYEDEXPANSION

set PORT=%PORT%
if "%PORT%"=="" set PORT=4000
set HOST=%HOST%
if "%HOST%"=="" set HOST=0.0.0.0
set USE_MIRROR=%USE_MIRROR%
if "%USE_MIRROR%"=="" set USE_MIRROR=0

echo ==^> AcademicPages dev server (Windows)
echo     HOST=%HOST% PORT=%PORT% USE_MIRROR=%USE_MIRROR%

where docker >nul 2>nul
if %ERRORLEVEL%==0 (
  echo >> Using Docker (jekyll/jekyll:4) ...
  docker run --rm -it -p %PORT%:%PORT% -v "%cd%":/site -w /site jekyll/jekyll:4 ^
    bash -lc "bundle config set path vendor/bundle && if [ %USE_MIRROR% = 1 ]; then bundle config set mirror.https://rubygems.org https://gems.ruby-china.com; fi && bundle install && bundle exec jekyll serve --host %HOST% --port %PORT% --livereload"
  goto :eof
)

where bundle >nul 2>nul
if %ERRORLEVEL%==0 (
  if %USE_MIRROR%==1 bundle config set mirror.https://rubygems.org https://gems.ruby-china.com
  bundle config set path vendor/bundle
  bundle install
  bundle exec jekyll serve --host %HOST% --port %PORT% --livereload
  goto :eof
)

where gem >nul 2>nul
if %ERRORLEVEL%==0 (
  echo >> Installing bundler via gem ...
  gem install bundler
  if %USE_MIRROR%==1 bundle config set mirror.https://rubygems.org https://gems.ruby-china.com
  bundle config set path vendor/bundle
  bundle install
  bundle exec jekyll serve --host %HOST% --port %PORT% --livereload
  goto :eof
)

echo ERROR: Neither Docker nor Ruby (gem/bundle) found. Please install Docker Desktop or RubyInstaller first.
exit /b 1
