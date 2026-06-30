$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$port = 4173
while ($port -lt 4190) {
  $busy = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $port -ErrorAction SilentlyContinue
  if (-not $busy) { break }
  $port += 1
}

if ($port -ge 4190) {
  throw "No available port in 4173-4189."
}

$url = "http://127.0.0.1:$port/"
$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".svg" = "image/svg+xml"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $port)
$listener.Start()
Start-Process $url
Write-Host "Game started: $url"
Write-Host "Keep this window open. Closing it stops the local server."

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    while ($reader.ReadLine()) {}

    $urlPath = "/"
    if ($requestLine -match '^[A-Z]+\s+([^\s]+)') {
      $urlPath = $matches[1]
    }

    $relative = [Uri]::UnescapeDataString($urlPath.Split("?")[0].TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relative)) {
      $relative = "index.html"
    }

    $path = Join-Path $root $relative
    $resolved = [IO.Path]::GetFullPath($path)
    if (-not $resolved.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
      $status = "404 Not Found"
      $contentType = "text/plain; charset=utf-8"
      $body = [Text.Encoding]::UTF8.GetBytes("Not Found")
    } else {
      $status = "200 OK"
      $ext = [IO.Path]::GetExtension($resolved).ToLowerInvariant()
      $contentType = $mime[$ext]
      if (-not $contentType) {
        $contentType = "application/octet-stream"
      }
      $body = [IO.File]::ReadAllBytes($resolved)
    }

    $header = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($body, 0, $body.Length)
  } finally {
    $client.Close()
  }
}
