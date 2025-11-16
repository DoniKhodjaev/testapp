# PowerShell скрипт для генерации иконок

Write-Host "Generating icons from SVG..." -ForegroundColor Green

# Проверяем установлен ли @tauri-apps/cli
$tauriCli = Get-Command "cargo-tauri" -ErrorAction SilentlyContinue

if (-not $tauriCli) {
    Write-Host "Installing @tauri-apps/cli globally..." -ForegroundColor Yellow
    npm install -g @tauri-apps/cli
}

# Генерируем иконки
Write-Host "Generating icon files..." -ForegroundColor Yellow
npm run tauri icon src-tauri/icons/icon.svg

Write-Host "Icons generated successfully!" -ForegroundColor Green
Write-Host "You can now run: npm run tauri:dev" -ForegroundColor Cyan
