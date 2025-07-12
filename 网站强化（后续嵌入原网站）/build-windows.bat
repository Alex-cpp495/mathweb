@echo off
echo 正在构建AI学习平台...
echo.

echo [1/3] 安装依赖...
cd client
call npm install
if %errorlevel% neq 0 (
    echo 错误: npm install 失败
    pause
    exit /b 1
)

echo.
echo [2/3] 构建前端...
set GENERATE_SOURCEMAP=false
call npm run build
if %errorlevel% neq 0 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)

echo.
echo [3/3] 安装后端依赖...
cd ../server
call npm install
if %errorlevel% neq 0 (
    echo 错误: 后端依赖安装失败
    pause
    exit /b 1
)

echo.
echo ✅ 构建完成！
echo.
echo 可以使用以下命令启动:
echo   前端: cd client && npm start
echo   后端: cd server && npm start
echo.
pause 