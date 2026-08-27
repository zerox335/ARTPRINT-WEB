@echo off
setlocal
cd /d "%~dp0"

set "APP_URL=http://127.0.0.1:3000"

where node.exe >nul 2>nul || goto missing_node
where pnpm.cmd >nul 2>nul || goto missing_pnpm

curl.exe --silent --fail "%APP_URL%" >nul 2>nul
if not errorlevel 1 goto open_app

echo Iniciando PostgreSQL de ArtPrint...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\postgres-local.ps1" start
if errorlevel 1 goto database_error

echo Iniciando la tienda ArtPrint...
start "Servidor ArtPrint - no cerrar" cmd.exe /k "pnpm dev --hostname 127.0.0.1 --port 3000"

echo Esperando a que la pagina este lista...
timeout.exe /t 7 /nobreak >nul

:open_app
start "" "%APP_URL%"
exit /b 0

:missing_node
echo.
echo No se encontro Node.js. Instala Node.js 22 LTS y vuelve a intentarlo.
pause
exit /b 1

:missing_pnpm
echo.
echo No se encontro pnpm. Ejecuta: corepack enable ^&^& corepack prepare pnpm@11.19.0 --activate
pause
exit /b 1

:database_error
echo.
echo PostgreSQL no pudo iniciar. Abre Codex y pide: revisar PostgreSQL de ArtPrint.
pause
exit /b 1
