# Local development only. Downloads Keycloak into the ignored .local folder.
# Run from the repository root: powershell -ExecutionPolicy Bypass -File scripts/start-keycloak.ps1
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$version = '26.8.0'
$runtimeRoot = Join-Path $repoRoot '.local'
$runtime = Join-Path $runtimeRoot "keycloak-$version"
$archive = Join-Path $runtimeRoot "keycloak-$version.zip"
New-Item -ItemType Directory -Force $runtimeRoot | Out-Null
if (-not (Test-Path (Join-Path $runtime 'bin/kc.bat'))) {
    if (-not (Test-Path $archive)) {
        Invoke-WebRequest "https://github.com/keycloak/keycloak/releases/download/$version/keycloak-$version.zip" -OutFile $archive
    }
    $expected = '7ed1de3fda2598369262613bf682aab7e233d80a38c405e91588f7a7454370a1'
    if ((Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) {
        throw 'Keycloak download checksum mismatch. Remove the ZIP and retry.'
    }
    Expand-Archive -LiteralPath $archive -DestinationPath $runtimeRoot -Force
}
$importDir = Join-Path $runtime 'data/import'
New-Item -ItemType Directory -Force $importDir | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot 'keycloak/jwt-login-realm.json') -Destination $importDir
$env:KC_BOOTSTRAP_ADMIN_USERNAME = 'admin'
$env:KC_BOOTSTRAP_ADMIN_PASSWORD = 'local-admin-change-me'
# Bind only to this computer. Startup import skips realms that already exist.
& (Join-Path $runtime 'bin/kc.bat') start-dev --http-host=127.0.0.1 --http-port=9090 --import-realm
exit $LASTEXITCODE
