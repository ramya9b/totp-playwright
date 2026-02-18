# Find which project has the variable groups and secure files

$Token = Read-Host "Paste your PAT token"

$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$Token"))
$Headers = @{
    "Authorization" = "Basic $EncodedToken"
    "Content-Type"  = "application/json"
}

Write-Host "Searching for variable groups and secure files in RSATwithAzure..." -ForegroundColor Cyan
Write-Host ""

# Get all projects
$Projects = (Invoke-RestMethod -Uri "https://dev.azure.com/RSATwithAzure/_apis/projects?api-version=7.1-preview.4" `
    -Headers $Headers -Method Get).value

foreach ($Project in $Projects) {
    Write-Host "Project: $($Project.name)" -ForegroundColor Yellow
    
    # Check variable groups
    try {
        $VarGroups = (Invoke-RestMethod -Uri "https://dev.azure.com/RSATwithAzure/$($Project.name)/_apis/distributedtask/variablegroups?api-version=7.1-preview.2" `
            -Headers $Headers -Method Get -ErrorAction Stop).value
        
        if ($VarGroups.Count -gt 0) {
            Write-Host "   Variable Groups:" -ForegroundColor Green
            $VarGroups | ForEach-Object { Write-Host "      - $($_.name) (ID: $($_.id))" -ForegroundColor Cyan }
        }
    } catch {
        Write-Host "   Variable Groups: (none or error)" -ForegroundColor Gray
    }
    
    # Check secure files
    try {
        $SecureFiles = (Invoke-RestMethod -Uri "https://dev.azure.com/RSATwithAzure/$($Project.name)/_apis/distributedtask/securefiles?api-version=7.1-preview.1" `
            -Headers $Headers -Method Get -ErrorAction Stop).value
        
        if ($SecureFiles.Count -gt 0) {
            Write-Host "   Secure Files:" -ForegroundColor Green
            $SecureFiles | ForEach-Object { Write-Host "      - $($_.name) (ID: $($_.id))" -ForegroundColor Cyan }
        }
    } catch {
        Write-Host "   Secure Files: (none or error)" -ForegroundColor Gray
    }
    
    Write-Host ""
}
