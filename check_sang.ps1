Add-Type -AssemblyName System.Drawing

$img1 = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang1.jpg")
Write-Host "sang1.jpg: Width=$($img1.Width), Height=$($img1.Height)"
$img1.Dispose()

$img2 = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang2.jpg")
Write-Host "sang2.jpg: Width=$($img2.Width), Height=$($img2.Height)"
$img2.Dispose()

# Also create js/sang_data.js with Base64 embedded strings just like jo_data.js!
$bytes1 = [System.IO.File]::ReadAllBytes("$PSScriptRoot\sang1.jpg")
$b64_1 = [System.Convert]::ToBase64String($bytes1)

$bytes2 = [System.IO.File]::ReadAllBytes("$PSScriptRoot\sang2.jpg")
$b64_2 = [System.Convert]::ToBase64String($bytes2)

$content = "window.SANG1_DATA_URL = ""data:image/jpeg;base64,$b64_1"";`nwindow.SANG2_DATA_URL = ""data:image/jpeg;base64,$b64_2"";`n"
[System.IO.File]::WriteAllText("$PSScriptRoot\js\sang_data.js", $content)
Write-Host "js/sang_data.js created successfully! Sang1: $($b64_1.Length), Sang2: $($b64_2.Length)"
