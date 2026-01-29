# ============================================================================
# Authorization Summary and Manual Steps
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  Pipeline Authorization Summary                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Your Azure DevOps Setup:" -ForegroundColor Cyan
Write-Host "   Organization: RSATwithAzure" -ForegroundColor Green
Write-Host "   Project: PlaywrightTests" -ForegroundColor Green
Write-Host "   Pipeline: totp-playwright (ID: 57)" -ForegroundColor Green
Write-Host ""

Write-Host "Resources to Authorize:" -ForegroundColor Yellow
Write-Host "   Variable Groups:" -ForegroundColor Cyan
Write-Host "      1. Playwright-Testing-Secrets_totp (ID: 3)" -ForegroundColor Green
Write-Host "      2. Playwright-Testing-Secrets (ID: 2)" -ForegroundColor Green
Write-Host ""
Write-Host "   Secure Files:" -ForegroundColor Cyan
Write-Host "      1. D365AuthFile.json" -ForegroundColor Green
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║               Manual Authorization Steps (via Azure Pipelines UI)          ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Authorize Variable Groups" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "For each variable group (Playwright-Testing-Secrets_totp and Playwright-Testing-Secrets):" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Go to: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_library?itemType=VariableGroups" -ForegroundColor Green
Write-Host "  2. Click on the variable group name" -ForegroundColor Yellow
Write-Host "  3. Click 'Pipeline permissions' or 'Manage roles'" -ForegroundColor Yellow
Write-Host "  4. Click the '+ button' to add pipeline permissions" -ForegroundColor Yellow
Write-Host "  5. Select 'totp-playwright' pipeline" -ForegroundColor Yellow
Write-Host "  6. Click 'Authorize' or 'Add'" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 2: Authorize Secure Files" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "For D365AuthFile.json:" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Go to: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_library?itemType=SecureFiles" -ForegroundColor Green
Write-Host "  2. Click on 'D365AuthFile.json'" -ForegroundColor Yellow
Write-Host "  3. Click 'Pipeline permissions' button" -ForegroundColor Yellow
Write-Host "  4. Click the '+' button to add pipeline" -ForegroundColor Yellow
Write-Host "  5. Select 'totp-playwright' pipeline" -ForegroundColor Yellow
Write-Host "  6. Click 'Authorize' or 'Add'" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 3: Verify Authorization" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Go to your pipeline: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_build?definitionId=57" -ForegroundColor Green
Write-Host "  2. Queue a new build" -ForegroundColor Yellow
Write-Host "  3. If no permission prompts appear, authorization was successful!" -ForegroundColor Yellow
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                        Quick Links                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Variable Groups Library:" -ForegroundColor Cyan
Write-Host "  https://dev.azure.com/RSATwithAzure/PlaywrightTests/_library?itemType=VariableGroups" -ForegroundColor Green
Write-Host ""
Write-Host "Secure Files Library:" -ForegroundColor Cyan
Write-Host "  https://dev.azure.com/RSATwithAzure/PlaywrightTests/_library?itemType=SecureFiles" -ForegroundColor Green
Write-Host ""
Write-Host "Pipeline Definition:" -ForegroundColor Cyan
Write-Host "  https://dev.azure.com/RSATwithAzure/PlaywrightTests/_build?definitionId=57" -ForegroundColor Green
Write-Host ""

Write-Host "After completing these steps, your scheduled pipelines will run without permission errors!" -ForegroundColor Green
Write-Host ""
