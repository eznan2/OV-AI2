Add-Type -AssemblyName System.Drawing
$artifactDir = "C:\Users\mea12\.gemini\antigravity-ide\brain\587e2f9a-d66e-494a-8a7c-d8c28f1b2b04"

$rotations = @(
    @{ name="rot0"; type=[System.Drawing.RotateFlipType]::RotateNoneFlipNone },
    @{ name="rot90"; type=[System.Drawing.RotateFlipType]::Rotate90FlipNone },
    @{ name="rot180"; type=[System.Drawing.RotateFlipType]::Rotate180FlipNone },
    @{ name="rot270"; type=[System.Drawing.RotateFlipType]::Rotate270FlipNone }
)

foreach ($r in $rotations) {
    $img = [System.Drawing.Image]::FromFile("$PSScriptRoot\sang2.jpg")
    if ($r.type -ne [System.Drawing.RotateFlipType]::RotateNoneFlipNone) {
        $img.RotateFlip($r.type)
    }
    $thumb = $img.GetThumbnailImage(300, 300, $null, [IntPtr]::Zero)
    $thumb.Save("$artifactDir\sang2_$($r.name).jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $thumb.Dispose()
    $img.Dispose()
}

Write-Host "All 4 rotations generated!"
