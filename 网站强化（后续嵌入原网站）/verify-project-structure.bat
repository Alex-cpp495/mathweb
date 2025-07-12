@echo off
echo 🔍 验证AI学习平台项目结构...
echo.

set "errors=0"

echo [检查] React前端必需文件:
if exist "client\src\index.js" (
    echo ✅ client\src\index.js
) else (
    echo ❌ client\src\index.js [缺失]
    set /a errors+=1
)

if exist "client\src\App.js" (
    echo ✅ client\src\App.js
) else (
    echo ❌ client\src\App.js [缺失]
    set /a errors+=1
)

if exist "client\src\index.css" (
    echo ✅ client\src\index.css
) else (
    echo ❌ client\src\index.css [缺失]
    set /a errors+=1
)

if exist "client\public\index.html" (
    echo ✅ client\public\index.html
) else (
    echo ❌ client\public\index.html [缺失]
    set /a errors+=1
)

if exist "client\package.json" (
    echo ✅ client\package.json
) else (
    echo ❌ client\package.json [缺失]
    set /a errors+=1
)

echo.
echo [检查] Node.js后端必需文件:
if exist "server\index.js" (
    echo ✅ server\index.js
) else (
    echo ❌ server\index.js [缺失]
    set /a errors+=1
)

if exist "server\package.json" (
    echo ✅ server\package.json
) else (
    echo ❌ server\package.json [缺失]
    set /a errors+=1
)

if exist "server\config.js" (
    echo ✅ server\config.js
) else (
    echo ❌ server\config.js [缺失]
    set /a errors+=1
)

echo.
echo [检查] 部署配置文件:
if exist "Dockerfile" (
    echo ✅ Dockerfile
) else (
    echo ❌ Dockerfile [缺失]
    set /a errors+=1
)

if exist "zeabur.yaml" (
    echo ✅ zeabur.yaml
) else (
    echo ❌ zeabur.yaml [缺失]
    set /a errors+=1
)

echo.
if %errors% equ 0 (
    echo 🎉 项目结构验证通过！所有必需文件都存在。
    echo.
    echo 现在可以尝试构建:
    echo   方法1: 运行 build-windows.bat
    echo   方法2: cd client && npm run build
    echo.
) else (
    echo ⚠️  发现 %errors% 个问题，请先修复这些文件。
    echo.
)

pause 