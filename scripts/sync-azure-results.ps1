# Azure DevOps Test Results Sync Script
# Downloads latest test artifacts from pipeline and syncs with local notebook

param(
    [string]$OrgName = "RSATwithAzure",
    [string]$ProjectName = "PlaywrightTests",
    [string]$RepoName = "totp-playwright",
    [string]$PATToken = "",
    [switch]$UpdateNotebook = $false,
    [switch]$ShowHelp = $false
)

if ($ShowHelp) {
    Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║       Azure DevOps Test Results Sync Script                    ║
║       Download artifacts and sync with Jupyter Notebook        ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
  .\sync-azure-results.ps1 -PATToken "your_token" [-UpdateNotebook]

PARAMETERS:
  -OrgName          : Azure DevOps organization (default: RSATwithAzure)
  -ProjectName      : Project name (default: PlaywrightTests)
  -RepoName         : Repository name (default: totp-playwright)
  -PATToken         : Personal Access Token (REQUIRED)
  -UpdateNotebook   : Automatically run notebook after sync
  -ShowHelp         : Display this help message

SETUP:
  1. Generate PAT token:
     https://dev.azure.com/{OrgName}/_usersSettings/tokens
  
  2. Create token with 'Build - Read' and 'Code - Read' scopes
  
  3. Run script:
     .\sync-azure-results.ps1 -PATToken "your_token_here"

EXAMPLE:
  .\sync-azure-results.ps1 -PATToken "abc123def456" -UpdateNotebook

"@
    exit 0
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Message.PadRight(50)) ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Validate inputs
if ([string]::IsNullOrEmpty($PATToken)) {
    Write-Header "Configuration Required"
    Write-Error "PAT token not provided"
    Write-Info "Generate a token at: https://dev.azure.com/$OrgName/_usersSettings/tokens"
    Write-Info "Scopes needed: Build (Read), Code (Read)"
    Write-Host ""
    Write-Host "Run with -ShowHelp for more information"
    exit 1
}

Write-Header "Azure DevOps Test Results Sync"

Write-Info "Organization: $OrgName"
Write-Info "Project: $ProjectName"
Write-Info "Repository: $RepoName"

# Create auth header
$EncodedPAT = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes(":$PATToken"))
$Headers = @{
    "Authorization" = "Basic $EncodedPAT"
    "Content-Type"  = "application/json"
}

$BaseUrl = "https://dev.azure.com/$OrgName/$ProjectName"
$ApiVersion = "7.0"

Write-Host ""
Write-Host "🔄 Fetching pipeline runs..." -ForegroundColor Yellow

try {
    # Get latest pipeline runs
    $RunsUrl = "$BaseUrl/_apis/build/builds?definitions=0&statusFilter=completed&resultFilter=partiallySucceeded,succeeded,failed&`$top=1&api-version=$ApiVersion"
    
    $RunsResponse = Invoke-RestMethod -Uri $RunsUrl -Headers $Headers -Method Get -ErrorAction Stop
    $Runs = $RunsResponse.value
    
    if ($Runs.Count -eq 0) {
        Write-Warning "No pipeline runs found"
        exit 1
    }
    
    $LatestRun = $Runs[0]
    $RunId = $LatestRun.id
    $RunNumber = $LatestRun.buildNumber
    $RunResult = $LatestRun.result
    
    Write-Success "Found latest run: #$RunNumber (Status: $RunResult)"
    
    Write-Host ""
    Write-Host "📦 Fetching artifacts..." -ForegroundColor Yellow
    
    # Get artifacts from the run
    $ArtifactsUrl = "$BaseUrl/_apis/build/builds/$RunId/artifacts?api-version=$ApiVersion"
    $ArtifactsResponse = Invoke-RestMethod -Uri $ArtifactsUrl -Headers $Headers -Method Get -ErrorAction Stop
    $Artifacts = $ArtifactsResponse.value
    
    if ($Artifacts.Count -eq 0) {
        Write-Warning "No artifacts found in this run"
        exit 0
    }
    
    Write-Success "Found $($Artifacts.Count) artifact(s)"
    
    # Download relevant artifacts
    $DownloadCount = 0
    foreach ($Artifact in $Artifacts) {
        $ArtifactName = $Artifact.name
        
        if ($ArtifactName -match 'test|result|allure|report') {
            Write-Info "  → Artifact: $ArtifactName"
            
            # Get artifact content location
            $DownloadUrl = $Artifact.resource.downloadUrl
            
            if ($DownloadUrl) {
                try {
                    # Create temp directory for download
                    $TempDir = Join-Path $env:TEMP "azure-artifacts-$([guid]::NewGuid().ToString().Substring(0,8))"
                    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
                    
                    Write-Host "     ↓ Downloading..." -ForegroundColor DarkCyan
                    
                    # Download artifact (usually ZIP file)
                    $OutFile = Join-Path $TempDir "$ArtifactName.zip"
                    Invoke-WebRequest -Uri $DownloadUrl -Headers @{"Authorization" = $Headers["Authorization"]} -OutFile $OutFile -ErrorAction Stop
                    
                    Write-Success "    Downloaded: $ArtifactName"
                    
                    # Extract and copy relevant files
                    $ExtractDir = Join-Path $TempDir "extracted"
                    Expand-Archive -Path $OutFile -DestinationPath $ExtractDir -Force | Out-Null
                    
                    # Copy test result files to current directory
                    Get-ChildItem $ExtractDir -Recurse -Include "*.csv", "*.json", "*.png" | ForEach-Object {
                        $DestPath = Join-Path (Get-Location) $_.Name
                        Copy-Item -Path $_.FullName -Destination $DestPath -Force
                        Write-Host "       ✓ $($_.Name)" -ForegroundColor DarkGreen
                        $DownloadCount++
                    }
                    
                    # Cleanup
                    Remove-Item -Path $TempDir -Recurse -Force | Out-Null
                    
                } catch {
                    Write-Warning "Failed to download $ArtifactName : $_"
                }
            }
        }
    }
    
    Write-Host ""
    if ($DownloadCount -gt 0) {
        Write-Success "$DownloadCount file(s) synchronized to local directory"
        
        Write-Info "Updated files:"
        Get-Item -Path "test_results.*", "test_cases_detailed.csv" -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
        }
        
        if ($UpdateNotebook) {
            Write-Host ""
            Write-Host "🚀 Updating Jupyter notebook..." -ForegroundColor Yellow
            
            # Try to execute notebook with jupyter
            try {
                & jupyter nbconvert --to notebook --execute test_results_report.ipynb
                Write-Success "Notebook updated with latest results"
            } catch {
                Write-Warning "Could not auto-execute notebook. Run manually: jupyter notebook test_results_report.ipynb"
            }
        }
    } else {
        Write-Warning "No test result files found in artifacts"
    }
    
} catch {
    Write-Error "Failed to sync artifacts: $_"
    exit 1
}

Write-Host ""
Write-Success "Sync completed!"
Write-Info "Next steps:"
Write-Host "  1. Run notebook: jupyter notebook test_results_report.ipynb" -ForegroundColor Cyan
Write-Host "  2. Results will be in allure-results/ directory" -ForegroundColor Cyan
Write-Host "  3. CSV/JSON exports available in current directory" -ForegroundColor Cyan
Write-Host ""
