param(
  [int]$Port = 8080
)

function Get-LanIPv4 {
  try {
    $candidates = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | Where-Object {
      $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"
    })
    $preferred = $candidates | Where-Object { $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" } | Select-Object -First 1
    if ($preferred) { return $preferred.IPAddress }
    if ($candidates.Count -gt 0) { return $candidates[0].IPAddress }
  } catch {}
  try {
    $entry = [System.Net.Dns]::GetHostEntry([System.Net.Dns]::GetHostName())
    foreach ($addr in $entry.AddressList) {
      $text = $addr.IPAddressToString
      if ($addr.AddressFamily.ToString() -eq "InterNetwork" -and $text -notlike "127.*" -and $text -notlike "169.254.*") {
        return $text
      }
    }
  } catch {}
  return $null
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

$script:LanIp = Get-LanIPv4
$script:LanUrl = if ($script:LanIp) { "http://$($script:LanIp):$Port/" } else { $prefix }
$script:LanBound = $false
if ($script:LanIp) {
  try {
    $listener.Prefixes.Add($script:LanUrl)
    $listener.Start()
    $script:LanBound = $true
  } catch {
    $listener.Close()
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
    Write-Host " LAN bind skipped (Windows urlacl). Desktop stays on localhost." -ForegroundColor Yellow
  }
} else {
  $listener.Start()
}

Write-Host "=====================================================" -ForegroundColor Green
Write-Host " IRON ARC (NNN + Winter Arc MVP) running at:" -ForegroundColor Green
Write-Host " -> $prefix" -ForegroundColor Cyan
if ($script:LanIp) {
  $lanNote = if ($script:LanBound) { "iPhone on the same Wi-Fi" } else { "detected, bind not active" }
  Write-Host " -> $($script:LanUrl)  ($lanNote)" -ForegroundColor Cyan
}
Write-Host "=====================================================" -ForegroundColor Green

$mimeTypes = @{
  ".html"         = "text/html; charset=utf-8"
  ".css"          = "text/css; charset=utf-8"
  ".js"           = "application/javascript; charset=utf-8"
  ".webmanifest"  = "application/manifest+json; charset=utf-8"
  ".json"         = "application/json; charset=utf-8"
  ".svg"          = "image/svg+xml"
  ".png"          = "image/png"
  ".mobileconfig" = "application/x-apple-aspen-config"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $relPath = $request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($relPath)) {
      $relPath = "index.html"
    }

    if ($relPath -eq "lan.json") {
      $ipValue = if ($script:LanIp) { $script:LanIp } else { "127.0.0.1" }
      $urlValue = if ($script:LanIp) { $script:LanUrl } else { $prefix }
      $boundValue = if ($script:LanBound) { "true" } else { "false" }
      $payload = '{"ip":"' + $ipValue + '","port":' + $Port + ',"url":"' + $urlValue + '","bound":' + $boundValue + '}'
      $lanBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
      $response.ContentType = "application/json; charset=utf-8"
      $response.Headers["Cache-Control"] = "no-store"
      $response.ContentLength64 = $lanBytes.Length
      $response.OutputStream.Write($lanBytes, 0, $lanBytes.Length)
      $response.OutputStream.Close()
      continue
    }

    $filePath = Join-Path $PSScriptRoot $relPath
    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
      $response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
      $response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $response.StatusCode = 404
    }
    $response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
}
