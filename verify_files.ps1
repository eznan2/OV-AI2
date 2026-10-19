$jsFiles = @(
    'js/jo_data.js',
    'js/faces_data.js',
    'js/audio.js',
    'js/weapons.js',
    'js/bot.js',
    'js/boss.js',
    'js/map.js',
    'js/player.js',
    'js/ui.js',
    'js/game.js'
)

foreach ($f in $jsFiles) {
    if (Test-Path $f) {
        $content = [System.IO.File]::ReadAllText($f)
        Write-Host "File: $f - Size: $($content.Length) bytes - OK"
    } else {
        Write-Host "File NOT FOUND: $f"
    }
}
