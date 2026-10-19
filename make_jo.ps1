$bytes = [System.IO.File]::ReadAllBytes('JO.jpg')
$b64 = [System.Convert]::ToBase64String($bytes)
$content = "window.JO_DATA_URL = ""data:image/jpeg;base64,$b64"";`n"
[System.IO.File]::WriteAllText('js/jo_data.js', $content)
Write-Host "Done! Size: $($b64.Length)"
