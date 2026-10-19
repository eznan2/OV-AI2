Add-Type -AssemblyName System.Drawing

function Get-Base64Jpeg($imagePath, $size) {
    $img = [System.Drawing.Image]::FromFile($imagePath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
    $g.Dispose()
    $img.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]90)
    $bmp.Save($ms, $encoder, $encoderParams)
    $bytes = $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()

    $b64 = [Convert]::ToBase64String($bytes)
    return "data:image/jpeg;base64,$b64"
}

$sang1Url = Get-Base64Jpeg "$PSScriptRoot\sang1_face.jpg" 512
$sang2Url = Get-Base64Jpeg "$PSScriptRoot\sang2_face.jpg" 512

$jsContent = @"
// Base64 encoded face textures for Yoon-sang Boss (Chapter 2)
// sang1: Phase 1 (Rammus roll & reflect)
// sang2: Phase 2 (Giant spiked Yoon-sang, hair needle storm)
window.SANG1_DATA_URL = "$sang1Url";
window.SANG2_DATA_URL = "$sang2Url";
"@

[System.IO.File]::WriteAllText("$PSScriptRoot\js\sang_data.js", $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "js\sang_data.js successfully written! Size: $($jsContent.Length) characters"
