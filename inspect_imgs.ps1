Add-Type -AssemblyName System.Drawing

function Check-Img($path) {
    $img = [System.Drawing.Image]::FromFile($path)
    $hasExif = $false
    $orient = "none"
    foreach ($p in $img.PropertyItems) {
        if ($p.Id -eq 0x0112) {
            $hasExif = $true
            $orient = $p.Value[0]
        }
    }
    Write-Host "$path - Size: $($img.Width)x$($img.Height) - Orientation: $orient"
    $img.Dispose()
}

Check-Img "$PSScriptRoot\sang1.jpg"
Check-Img "$PSScriptRoot\sang2.jpg"
Check-Img "$PSScriptRoot\JO.jpg"
foreach ($f in (Get-ChildItem "$PSScriptRoot\KakaoTalk*.jpg")) {
    Check-Img $f.FullName
}
