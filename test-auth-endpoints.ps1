# Test authorization endpoints

$Token = Read-Host "Paste your PAT token"

$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$Token"))
$Headers = @{
    "Authorization" = "Basic $EncodedToken"
    "Content-Type"  = "application/json"
}

$Organization = "RSATwithAzure"
$ProjectName = "PlaywrightTests"
$PipelineId = 57
$VarGroupId = 3  # Playwright-Testing-Secrets_totp

Write-Host "Testing authorization endpoints..." -ForegroundColor Cyan
Write-Host ""

# Try different path formats
$Endpoints = @(
    "https://dev.azure.com/$Organization/$ProjectName/_apis/pipelines/$PipelineId/pipelineresources/variablegroups/$VarGroupId?api-version=7.1-preview.1",
    "https://dev.azure.com/$Organization/$ProjectName/_apis/pipelines/$PipelineId/resources/variablegroups/$VarGroupId?api-version=7.1-preview.1",
    "https://dev.azure.com/$Organization/$ProjectName/_apis/build/resources/variablegroups/$VarGroupId?pipeline=$PipelineId&api-version=7.1-preview.1"
)

foreach ($EndPoint in $Endpoints) {
    Write-Host "Testing: $EndPoint" -ForegroundColor Yellow
    
    try {
        $Body = @{ "authorized" = $true } | ConvertTo-Json
        
        $Response = Invoke-RestMethod -Uri $EndPoint -Headers $Headers -Method Patch -Body $Body -ErrorAction Stop
        
        Write-Host "   ✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Response: $Response"
    } catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}
