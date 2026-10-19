$htmlPath = (Get-Item 'index.html').FullName.Replace('\', '/')
$url = "file:///$htmlPath"
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
& $edge --headless=new --dump-dom $url > test_edge_out.txt
$content = Get-Content 'test_edge_out.txt' -Head 35
Write-Host "Read lines: $($content.Count)"
$content
