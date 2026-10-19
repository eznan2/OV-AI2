Add-Type -AssemblyName System.Drawing

# 1. Process sang1.jpg
$img1 = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang1.jpg")
Write-Host "Processing sang1.jpg: $($img1.Width)x$($img1.Height)"

# Face is around X=1000..1750, Y=520..1550
# Let's crop a square region centered around the face:
# Center around X=1360, Y=1060.
$cropSize1 = 1250
$cropX1 = [Math]::Max(0, [Math]::Min($img1.Width - $cropSize1, 1360 - [int]($cropSize1 / 2)))
$cropY1 = [Math]::Max(0, [Math]::Min($img1.Height - $cropSize1, 1080 - [int]($cropSize1 / 2)))

$bmp1 = New-Object System.Drawing.Bitmap($cropSize1, $cropSize1)
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$srcRect1 = New-Object System.Drawing.Rectangle($cropX1, $cropY1, $cropSize1, $cropSize1)
$dstRect1 = New-Object System.Drawing.Rectangle(0, 0, $cropSize1, $cropSize1)
$g1.DrawImage($img1, $dstRect1, $srcRect1, [System.Drawing.GraphicsUnit]::Pixel)
$g1.Dispose()
$img1.Dispose()

$bmp1.Save("$PSScriptRoot\sang1_face.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp1.Dispose()
Write-Host "sang1_face.jpg saved!"

# 2. Process sang2.jpg (Rotate 90 CW first!)
$img2 = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang2.jpg")
Write-Host "Processing sang2.jpg: $($img2.Width)x$($img2.Height), rotating 90 CW..."
$img2.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone)
Write-Host "After rotation: $($img2.Width)x$($img2.Height)"

# Save full rotated image first to inspect
$img2.Save("$PSScriptRoot\sang2_rotated.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$img2.Dispose()
Write-Host "sang2_rotated.jpg saved!"
