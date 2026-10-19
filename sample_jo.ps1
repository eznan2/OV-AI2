Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile((Get-Item 'JO.jpg').FullName)
Write-Host "Width: $($img.Width), Height: $($img.Height)"
# Sample colors at different Y coordinates (center X)
for ($y = 100; $y -lt $img.Height; $y += 200) {
    $c = $img.GetPixel([int]($img.Width / 2), $y)
    Write-Host "Y=$y : R=$($c.R), G=$($c.G), B=$($c.B)"
}
$img.Dispose()
