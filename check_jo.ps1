Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Get-Item 'JO.jpg').FullName)
Write-Host "Width: $($img.Width), Height: $($img.Height)"
$img.Dispose()
