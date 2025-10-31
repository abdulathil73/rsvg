<#
PowerShell helper to initialize a Git repo and push to GitHub.
Usage:
  1) Open PowerShell in this folder (C:\Users\User\Desktop\rsvg1\webapp)
  2) Run: .\deploy_to_github.ps1 -RemoteUrl "https://github.com/username/repo.git"
  3) After pushing, create a Render service and add a Postgres DB, or follow README steps.

This script does not store credentials. If your Git remote requires authentication, use Git credential manager or set up SSH keys beforehand.
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$RemoteUrl
)

Write-Host "Initializing git repo (if not already)..."
if (-not (Test-Path .git)) {
  git init
} else {
  Write-Host ".git already exists"
}

Write-Host "Staging files..."
git add .

Write-Host "Committing..."
$commitMsg = "Initial commit: muscle-gain-coach"
try { git commit -m $commitMsg } catch { Write-Host "Nothing to commit or commit failed: $_" }

Write-Host "Adding remote origin: $RemoteUrl"
try { git remote add origin $RemoteUrl } catch { Write-Host "Remote origin may already exist" }

Write-Host "Creating branch main and pushing to origin..."
git branch -M main
Write-Host "Pushing to remote (you may be prompted to authenticate)..."
git push -u origin main

Write-Host "Done. If push succeeded, go to Render and connect the repo, then add a Postgres service and set DATABASE_URL in environment variables as instructed in the README."