@echo off
echo ================================
echo  AI学习平台 - Zeabur部署包创建工具
echo ================================
echo.

:: 设置变量
set DEPLOY_DIR=ai-learning-platform-deploy
set CLIENT_DIR=client

:: 检查client目录是否存在
if not exist "%CLIENT_DIR%" (
    echo ❌ 错误：找不到client目录
    echo 请确保在项目根目录下运行此脚本
    pause
    exit /b 1
)

:: 检查必要文件
if not exist "%CLIENT_DIR%\public\index.html" (
    echo ❌ 错误：找不到 %CLIENT_DIR%\public\index.html
    echo 请确保已经按照说明创建了index.html文件
    pause
    exit /b 1
)

echo ✅ 检查通过，开始创建部署包...
echo.

:: 删除旧的部署目录
if exist "%DEPLOY_DIR%" (
    echo 🗑️ 删除旧的部署目录...
    rmdir /s /q "%DEPLOY_DIR%"
)

:: 创建新的部署目录
echo 📁 创建部署目录：%DEPLOY_DIR%
mkdir "%DEPLOY_DIR%"

:: 复制public目录
echo 📄 复制public目录...
xcopy /E /I "%CLIENT_DIR%\public" "%DEPLOY_DIR%\public" > nul

:: 复制src目录
echo 📄 复制src目录...
xcopy /E /I "%CLIENT_DIR%\src" "%DEPLOY_DIR%\src" > nul

:: 复制package.json
echo 📄 复制package.json...
copy "%CLIENT_DIR%\package.json" "%DEPLOY_DIR%\package.json" > nul

:: 复制其他配置文件（如果存在）
if exist "%CLIENT_DIR%\nginx.conf" (
    echo 📄 复制nginx.conf...
    copy "%CLIENT_DIR%\nginx.conf" "%DEPLOY_DIR%\nginx.conf" > nul
)

if exist "%CLIENT_DIR%\.env.production" (
    echo 📄 复制.env.production...
    copy "%CLIENT_DIR%\.env.production" "%DEPLOY_DIR%\.env.production" > nul
)

echo.
echo ✅ 部署包创建完成！
echo.
echo 📂 部署目录：%DEPLOY_DIR%
echo.
echo 📋 目录结构：
dir "%DEPLOY_DIR%" /B
echo.
echo 📋 public目录内容：
dir "%DEPLOY_DIR%\public" /B
echo.

:: 验证关键文件
echo 🔍 验证关键文件...
if exist "%DEPLOY_DIR%\public\index.html" (
    echo ✅ index.html 存在
) else (
    echo ❌ index.html 缺失
)

if exist "%DEPLOY_DIR%\src" (
    echo ✅ src目录 存在
) else (
    echo ❌ src目录 缺失
)

if exist "%DEPLOY_DIR%\package.json" (
    echo ✅ package.json 存在
) else (
    echo ❌ package.json 缺失
)

echo.
echo 🚀 下一步操作：
echo 1. 将 %DEPLOY_DIR% 整个文件夹压缩为ZIP文件
echo 2. 上传ZIP文件到Zeabur
echo 3. 在Zeabur设置环境变量：
echo    REACT_APP_API_URL=你的后端地址
echo    NODE_ENV=production
echo    GENERATE_SOURCEMAP=false
echo.
echo ✨ 完成！你的项目现在可以成功部署到Zeabur了！
echo.
pause 