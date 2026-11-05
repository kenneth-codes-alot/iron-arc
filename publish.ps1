param(
  [string]$Message = "Update IRON ARC app"
)

git add -A
git commit -m $Message
git push origin main

Write-Host "=====================================================" -ForegroundColor Green
Write-Host " Pushed to GitHub Pages! Live in ~30-45 seconds at:" -ForegroundColor Green
Write-Host " -> https://kenneth-codes-alot.github.io/iron-arc/?mode=prod" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Green
