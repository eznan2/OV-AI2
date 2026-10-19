$txt = [System.IO.File]::ReadAllText('js/faces_data.js')
Write-Host "Total length: $($txt.Length)"
$idx = $txt.LastIndexOf('window.FACE_TEXTURES')
Write-Host "window.FACE_TEXTURES index: $idx"
$idxJo = $txt.IndexOf('window.JO_DATA_URL')
Write-Host "window.JO_DATA_URL index: $idxJo"
if ($idxJo -gt 0) {
    $clean = $txt.Substring(0, $idxJo).TrimEnd()
    [System.IO.File]::WriteAllText('js/faces_data.js', $clean)
    Write-Host "Cleaned faces_data.js. New length: $($clean.Length)"
}
