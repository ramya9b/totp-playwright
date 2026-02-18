# Check pipelines in PlaywrightTests

$Token = Read-Host "Paste your PAT token"

$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$Token"))
$Headers = @{
    "Authorization" = "Basic $EncodedToken"
    "Content-Type"  = "application/json"
}

Write-Host "Pipelines in PlaywrightTests project:" -ForegroundColor Cyan
Write-Host ""

$Pipelines = (Invoke-RestMethod -Uri "https://dev.azure.com/RSATwithAzure/PlaywrightTests/_apis/pipelines?api-version=7.1-preview.1" `
    -Headers $Headers -Method Get).value

$Pipelines | ForEach-Object {
    Write-Host "Name: $($_.name)" -ForegroundColor Green
    Write-Host "ID: $($_.id)" -ForegroundColor Gray
    Write-Host ""
}
