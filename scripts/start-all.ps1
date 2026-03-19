# Start DB (Postgres) and then build + start servers (Windows PowerShell)
# Usage: ./scripts/start-all.ps1

Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

Write-Output "Starting Postgres via docker-compose..."
docker-compose up -d db

$maxWait = 60
$wait = 0
Write-Output "Waiting for Postgres to accept connections on localhost:5432..."
while ($wait -lt $maxWait) {
  $res = Test-NetConnection -ComputerName '127.0.0.1' -Port 5432 -WarningAction SilentlyContinue
  if ($res.TcpTestSucceeded) { break }
  Start-Sleep -Seconds 1
  $wait++
}
if ($wait -ge $maxWait) {
  Write-Error "Postgres did not become available within $maxWait seconds."
  Pop-Location
  exit 1
}

Write-Output "Building project (bun build)..."
bun install
bun build ./src/main.ts --outdir ./dist --target bun

Write-Output "Starting servers: login, cluster, world"
Start-Process -NoNewWindow -FilePath bun -ArgumentList 'run','src/main.ts','login'
Start-Process -NoNewWindow -FilePath bun -ArgumentList 'run','src/main.ts','cluster'
Start-Process -NoNewWindow -FilePath bun -ArgumentList 'run','src/main.ts','world'

Write-Output "All services started."
Pop-Location
