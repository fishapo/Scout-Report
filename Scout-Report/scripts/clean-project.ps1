$ErrorActionPreference = "Stop"

Write-Host "Scout Report cleanup"
Write-Host "Working directory: $(Get-Location)"

$remove = @(
  "node_modules",
  ".env.BAD-BACKUP",
  "*.bak",
  "*.tmp",
  "*.swp",
  "Scout-Report-Reviewed-2026-08-14"
)

foreach ($item in $remove) {
  Get-ChildItem -Path . -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like $item } |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path ".env") {
  Write-Warning ".env exists and is intentionally NOT deleted. Keep it local and untracked."
}

Write-Host "Cleanup complete. Review git status before staging anything."
git status --short
