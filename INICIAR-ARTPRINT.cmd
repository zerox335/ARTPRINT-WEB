@echo off
setlocal
cd /d "%~dp0"

set "APP_URL=http://127.0.0.1:3000"

where node.exe >nul 2>nul || goto missing_node
where pnpm.cmd >nul 2>nul || goto missing_pnpm

curl.exe --silent --fail "%APP_URL%" >nul 2>nul
if not errorlevel 1 goto open_app

if not exist ".env" (
  echo Preparando la configuracion local...
  copy /y ".env.example" ".env" >nul
)

if not exist "node_modules\@prisma\client" (
  echo Instalando los componentes de ArtPrint. Esto solo ocurre la primera vez...
  call pnpm.cmd install --frozen-lockfile
  if errorlevel 1 goto install_error
)

echo Preparando Prisma...
call pnpm.cmd db:generate
if errorlevel 1 goto prisma_error

echo Iniciando PostgreSQL de ArtPrint...
if exist "%CD%\.tools\postgresql-18.6\pgsql\bin\pg_ctl.exe" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\postgres-local.ps1" start
) else (
  where docker.exe >nul 2>nul || goto database_missing
  docker.exe compose up -d postgres
)
if errorlevel 1 goto database_error

echo Actualizando la base de datos...
call pnpm.cmd db:deploy
if errorlevel 1 goto database_error
if not exist ".artprint-seeded" (
  echo Cargando el catalogo inicial...
  call pnpm.cmd db:seed
  if errorlevel 1 goto database_error
  type nul > ".artprint-seeded"
)

echo Iniciando la tienda ArtPrint...
start "Servidor ArtPrint - no cerrar" cmd.exe /k "pnpm.cmd dev --hostname 127.0.0.1 --port 3000"

echo Esperando a que la pagina este lista...
set "TRIES=0"
:wait_app
timeout.exe /t 1 /nobreak >nul
curl.exe --silent --fail "%APP_URL%" >nul 2>nul
if not errorlevel 1 goto open_app
set /a TRIES+=1
if %TRIES% LSS 45 goto wait_app

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

:install_error
echo.
echo No se pudieron instalar los componentes. Revisa tu conexion a internet y vuelve a abrir este archivo.
pause
exit /b 1

:prisma_error
echo.
echo Prisma no pudo prepararse. Ejecuta en esta carpeta: pnpm db:generate
pause
exit /b 1

:database_missing
echo.
echo No se encontro PostgreSQL local ni Docker. Instala Docker Desktop o recupera la carpeta .tools del proyecto completo.
pause
exit /b 1

:database_error
echo.
echo PostgreSQL no pudo iniciar. Abre Codex y pide: revisar PostgreSQL de ArtPrint.
pause
exit /b 1
