# PowerShell Script to Convert HTML Resume to PDF

param(
    [string]$HtmlPath = "resume.html",
    [string]$OutputPath = "Sonal_Gupta_Resume.pdf"
)

# Function to check if a browser is installed
function Test-Browser {
    param([string]$BrowserPath)
    return Test-Path $BrowserPath
}

# Try to find Chrome or Edge
$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

$BrowserPath = $null
if (Test-Browser $ChromePath) {
    $BrowserPath = $ChromePath
    $BrowserName = "Chrome"
} elseif (Test-Browser $EdgePath) {
    $BrowserPath = $EdgePath
    $BrowserName = "Edge"
} else {
    Write-Host "Chrome or Edge not found."
    exit 1
}

$FullHtmlPath = (Resolve-Path $HtmlPath).Path
$FullOutputPath = (Resolve-Path .).Path + "\$OutputPath"

Write-Host "Converting resume to PDF..."

& $BrowserPath --headless --disable-gpu --print-to-pdf="$FullOutputPath" "file:///$FullHtmlPath" | Out-Null

if (Test-Path $FullOutputPath) {
    Write-Host "Resume PDF generated successfully!"
} else {
    Write-Host "PDF generation attempted."
}
