function Test-PortInUse {
  param([int]$port)
  $tcp = New-Object System.Net.Sockets.TcpClient
  try {
    $tcp.Connect('127.0.0.1', $port)
    return $true
  } catch {
    return $false
  } finally {
    if ($tcp.Connected) { $tcp.Close() }
  }
}

function Get-FreePort {
  param(
    [int]$startPort = 5000,
    [int]$maxTry    = 20
  )
  for ($p = $startPort; $p -lt $startPort + $maxTry; $p++) {
    if (-not (Test-PortInUse -port $p)) { return $p }
  }
  throw "No free ports found from $startPort to $($startPort + $maxTry - 1)"
}

$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
  Write-Error "Missing $envFile"
  exit 1
}

Get-Content $envFile | ForEach-Object {
  if (-not [string]::IsNullOrWhiteSpace($_) -and $_ -notmatch '^[\s#]') {
    $parts = $_ -split '=', 2
    if ($parts.Length -eq 2) { Set-Item -Path "Env:$($parts[0])" -Value $parts[1].Trim() }
  }
}

$mysqlHost = $env:DB_HOST
if (-not $mysqlHost) { $mysqlHost = "localhost" }
$mysqlPort = $env:DB_PORT
if (-not $mysqlPort) { $mysqlPort = "3306" }
$mysqlUser = $env:DB_USER
if (-not $mysqlUser) { $mysqlUser = "root" }
$mysqlPass = $env:DB_PASSWORD
if (-not $mysqlPass) { $mysqlPass = "" }
$dbName = $env:DB_NAME
if (-not $dbName) { $dbName = "post_office_8" }
$portEnv = $env:PORT
if (-not $portEnv) { $basePort = 5000 } else { $basePort = [int]$portEnv }

Write-Host "1) Starting MySQL service..."
Try {
  Start-Service -Name MySQL -ErrorAction Stop
} Catch {
  Try { Start-Service -Name MySQL80 -ErrorAction Stop } Catch { Write-Warning "MySQL service not found or already running." }
}

Write-Host "2) Creating database if not exists: $dbName"
if ($mysqlPass) {
  & mysql -h $mysqlHost -P $mysqlPort -u $mysqlUser -p$mysqlPass -e "CREATE DATABASE IF NOT EXISTS $dbName;"
} else {
  & mysql -h $mysqlHost -P $mysqlPort -u $mysqlUser -e "CREATE DATABASE IF NOT EXISTS $dbName;"
}
if ($LASTEXITCODE -ne 0) { Write-Error "Unable to create DB (exit code $LASTEXITCODE)"; exit 2 }

$schemaPath = "schema.sql"
if (Test-Path $schemaPath) {
  Write-Host "3) Importing schema from $schemaPath"
  if ($mysqlPass) {
    Get-Content $schemaPath | & mysql -h $mysqlHost -P $mysqlPort -u $mysqlUser -p$mysqlPass $dbName
  } else {
    Get-Content $schemaPath | & mysql -h $mysqlHost -P $mysqlPort -u $mysqlUser $dbName
  }
  if ($LASTEXITCODE -ne 0) { Write-Error "Schema import failed"; exit 3 }
} else {
  Write-Host "3) No schema.sql file found; skipping schema import. Ensure tables exist by other means."
}

$seedPath = "Seed_Data.sql"
if (-not (Test-Path $seedPath)) {
  $alt = "c:\Users\bobmo\AppData\Local\Temp\b892cf5b-603d-4ee9-8fbd-de5163e43f43_DatabaseTeam8-main.zip.f43\DatabaseTeam8-main\Seed_Data.sql"
  if (Test-Path $alt) { $seedPath = $alt } else { Write-Error "Seed data file not found"; exit 4 }
}

Write-Host "4) Importing seed data from $seedPath"
if ($mysqlPass) {
  Get-Content $seedPath | & mysql -h $mysqlHost -P $mysqlPort -u $mysqlUser -p$mysqlPass $dbName
} else {
  Get-Content $seedPath | & mysql -h $mysqlHost -P $mysqlPort -u $mysqlUser $dbName
}
if ($LASTEXITCODE -ne 0) { Write-Error "Seed data import failed"; exit 5 }

$freePort = Get-FreePort -startPort $basePort -maxTry 20
if ($freePort -ne $basePort) {
  Write-Warning "Base port $basePort is in use. Using $freePort instead."
}
$env:PORT = $freePort

Write-Host "5) Starting backend on port $freePort"
Push-Location "backend"
if (-not (Test-Path "node_modules")) { npm install }
npm run dev -- --port $freePort
Pop-Location
