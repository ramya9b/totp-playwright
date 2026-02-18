# Simple Token Test Script
# No complex checks - just test the token directly

Write-Host "Testing PAT Token..." -ForegroundColor Cyan
Write-Host ""

$Token = Read-Host "Paste your PAT token"

if ($Token.Length -lt 20) {
    Write-Host "❌ Token too short" -ForegroundColor Red
    exit 1
}

Write-Host "Testing API calls with your token..."
Write-Host ""

$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$Token"))
$Headers = @{
    "Authorization" = "Basic $EncodedToken"
    "Content-Type"  = "application/json"
}

# Test 1
Write-Host "1. Testing https://app.vssps.visualstudio.com/_apis/profile/currentuser"
try {
    $r = Invoke-RestMethod -Uri "https://app.vssps.visualstudio.com/_apis/profile/currentuser?api-version=7.1-preview.3" `
        -Headers $Headers -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Success! User: $($r.displayName)"
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)"
}

Write-Host ""

# Test 2
Write-Host "2. Testing https://dev.azure.com/_apis/organizations"
try {
    $r = Invoke-RestMethod -Uri "https://dev.azure.com/_apis/organizations?api-version=7.1-preview.1" `
        -Headers $Headers -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Success! Organizations: $($r.value.Count)"
    $r.value | ForEach-Object { Write-Host "      - $($_.accountName)" }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)"
}

Write-Host ""

# Test 3
Write-Host "3. Testing https://dev.azure.com/RSATwithAzure/_apis/projects"
try {
    $r = Invoke-RestMethod -Uri "https://dev.azure.com/RSATwithAzure/_apis/projects?api-version=7.1-preview.4" `
        -Headers $Headers -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Success! Projects: $($r.value.Count)"
    $r.value | ForEach-Object { Write-Host "      - $($_.name)" }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)"
}
