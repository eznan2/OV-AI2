Add-Type -AssemblyName System.Drawing
$artifactDir = "C:\Users\mea12\.gemini\antigravity-ide\brain\587e2f9a-d66e-494a-8a7c-d8c28f1b2b04"

$img1 = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang1_face.jpg")
$thumb1 = $img1.GetThumbnailImage(512, 512, $null, [IntPtr]::Zero)
$thumb1.Save("$artifactDir\preview_sang1.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$thumb1.Dispose()
$img1.Dispose()

$img2 = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang2_rotated.jpg")
$thumb2 = $img2.GetThumbnailImage(450, 600, $null, [IntPtr]::Zero)
$thumb2.Save("$artifactDir\preview_sang2_rot.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$thumb2.Dispose()
$img2.Dispose()

Write-Host "Done saving thumbnails"
