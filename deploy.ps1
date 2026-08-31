# 倒卖大亨 - GitHub 部署脚本
# 用法：
#   1. 先在 GitHub 网页创建空仓库（不要勾选 README）
#   2. 在项目目录运行：
#      .\deploy.ps1 -RepoUrl https://github.com/<你的用户名>/trader-tycoon.git
param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

$ErrorActionPreference = "Stop"

# 1. 确保分支名是 main
$branch = git branch --show-current
if ($branch -ne "main") {
    git branch -M main
    Write-Host "已切换分支到 main"
}

# 2. 检查并添加 remote
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    git remote add origin $RepoUrl
    Write-Host "已添加 remote: $RepoUrl"
} else {
    Write-Host "remote 已存在: $remote"
}

# 3. 推送
git push -u origin main
Write-Host ""
Write-Host "推送完成！"
Write-Host "接下来去 GitHub 仓库 Settings -> Pages 开启 GitHub Pages："
Write-Host "  Source: Deploy from a branch"
Write-Host "  Branch: main, 目录: / (root)"
Write-Host ""
Write-Host "开启后访问："
Write-Host "  https://<你的用户名>.github.io/trader-tycoon/"
