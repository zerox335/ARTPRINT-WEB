param(
  [ValidateSet('start', 'stop', 'status')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$pgCtl = Join-Path $projectRoot '.tools\postgresql-18.6\pgsql\bin\pg_ctl.exe'
$dataDir = Join-Path $projectRoot '.data\postgresql-18'
$logFile = Join-Path $projectRoot '.data\postgresql-18.log'

if (-not (Test-Path -LiteralPath $pgCtl -PathType Leaf)) {
  throw 'PostgreSQL local no está instalado en .tools/postgresql-18.6.'
}
if (-not (Test-Path -LiteralPath (Join-Path $dataDir 'PG_VERSION') -PathType Leaf)) {
  throw 'El clúster local no está inicializado en .data/postgresql-18.'
}

switch ($Action) {
  'start' {
    & $pgCtl status --pgdata=$dataDir *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Output 'PostgreSQL local ya está iniciado.'
      break
    }
    & $pgCtl start --pgdata=$dataDir --log=$logFile --options='-h 127.0.0.1 -p 5432' --wait --timeout=30
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible iniciar PostgreSQL local.' }
  }
  'stop' {
    & $pgCtl status --pgdata=$dataDir *> $null
    if ($LASTEXITCODE -ne 0) {
      Write-Output 'PostgreSQL local ya está detenido.'
      break
    }
    & $pgCtl stop --pgdata=$dataDir --mode=fast --wait --timeout=30
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible detener PostgreSQL local.' }
  }
  'status' {
    & $pgCtl status --pgdata=$dataDir
    if ($LASTEXITCODE -ne 0) { exit 1 }
  }
}
