Add-Type -AssemblyName System.Drawing
$artifactDir = "C:\Users\mea12\.gemini\antigravity-ide\brain\587e2f9a-d66e-494a-8a7c-d8c28f1b2b04"

$img2 = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang2.jpg")
$img2.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) # Now 3000x4000 upright

$cropSize = 1800
$cropX = [Math]::Max(0, [Math]::Min($img2.Width - $cropSize, 1750 - [int]($cropSize / 2))) # 1750 - 900 = 850
$cropY = [Math]::Max(0, [Math]::Min($img2.Height - $cropSize, 1350 - [int]($cropSize / 2))) # 1350 - 900 = 450

$bmp = New-Object System.Drawing.Bitmap($cropSize, $cropSize)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)
$dstRect = New-Object System.Drawing.Rectangle(0, 0, $cropSize, $cropSize)
$g.DrawImage($img2, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$img2.Dispose()

$bmp.Save("$PSScriptRoot\sang2_face.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Also save a 512x512 preview to artifactDir
$thumb = $bmp.GetThumbnailImage(512, 512, $null, [IntPtr]::Zero)
$thumb.Save("$artifactDir\preview_sang2_face.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$thumb.Dispose()
$bmp.Dispose()

Write-Host "sang2_face.jpg created and preview saved!"
