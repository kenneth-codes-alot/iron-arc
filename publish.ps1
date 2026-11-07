param(
  [string]$Message = "Update IRON ARC app"
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$prodFiles = @(
  "index.html",
  "styles.css",
  "app.js",
  "dopamine-fx.js",
  "funnel-module.js",
  "features-module.js",
  "day1-onboarding.js",
  "live-app-telemetry.js",
  "panic2-engine.js",
  "blocker-shield.js",
  "iron-arc-shield.mobileconfig",
  "lockscreen-widget.js",
  "manifest.webmanifest",
  "sw.js",
  "capacitor.config.json"
)

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$GitArgs)
  & git @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArgs -join ' ') failed ($LASTEXITCODE)"
  }
}

function Write-Utf8 {
  param([string]$Path, [string]$Text)
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($Path, $Text, $utf8)
}

function Add-RobotsMeta {
  param([string]$Html)
  if ($Html -match 'name\s*=\s*["'']robots["'']') { return $Html }
  $meta = '  <meta name="robots" content="noindex, nofollow" />'
  if ($Html -notmatch '<head\s*>') { throw "index.html is missing a head element" }
  return [regex]::Replace($Html, '<head\s*>', "<head>`r`n$meta", 1)
}

function Get-RootDecoyHtml {
  $dash = [char]0x2014
  $html = @'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>404 __DASH__ Not Found</title>
  <style>
    body { margin: 2rem; background: #fff; color: #222; font-family: sans-serif; }
    h1 { font-size: 1.25rem; font-weight: 600; }
    p { font-size: 0.95rem; }
  </style>
  <script>
    (function () {
      var named = ["iron-arc-v1", "iron-arc-v2", "iron-arc-v3", "iron-arc-v4", "iron-arc-v5"];
      function doomed(name) {
        return named.indexOf(name) !== -1 || name.indexOf("iron-arc-") === 0;
      }
      try { window.localStorage.clear(); } catch (e) {}
      try { window.sessionStorage.clear(); } catch (e) {}
      try {
        fetch(location.pathname + location.search, { cache: "reload", credentials: "same-origin" }).catch(function () {});
      } catch (e) {}
      if (window.caches && typeof window.caches.keys === "function") {
        named.forEach(function (name) {
          try { window.caches.delete(name); } catch (e) {}
        });
        window.caches.keys().then(function (keys) {
          keys.forEach(function (name) {
            if (doomed(name)) window.caches.delete(name);
          });
        }).catch(function () {});
      }
      if (navigator.serviceWorker && typeof navigator.serviceWorker.getRegistrations === "function") {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (reg) {
            var path = "";
            try { path = new URL(reg.scope).pathname; } catch (e) { return; }
            if (path === "/iron-arc/" || path === "/iron-arc") reg.unregister();
          });
        }).catch(function () {});
      }
    })();
  </script>
</head>
<body>
  <h1>404 __DASH__ Not Found</h1>
  <p>The requested page does not exist.</p>
</body>
</html>
'@
  return $html.Replace("__DASH__", [string]$dash)
}

function Get-RootKillerSw {
  @'
self.addEventListener("install", function () {
  self.skipWaiting();
});

function wipeCaches() {
  var named = ["iron-arc-v1", "iron-arc-v2", "iron-arc-v3", "iron-arc-v4", "iron-arc-v5"];
  function doomed(name) {
    return named.indexOf(name) !== -1 || name.indexOf("iron-arc-") === 0;
  }
  return caches.keys().then(function (keys) {
    var pending = named.map(function (name) { return caches.delete(name); });
    keys.forEach(function (name) {
      if (doomed(name)) pending.push(caches.delete(name));
    });
    return Promise.all(pending);
  }).catch(function () {
    return Promise.all(named.map(function (name) { return caches.delete(name); }));
  });
}

self.addEventListener("activate", function (event) {
  event.waitUntil(
    wipeCaches()
      .then(function () { return self.clients.claim(); })
      .then(function () { return self.clients.matchAll({ type: "window", includeUncontrolled: true }); })
      .then(function (clients) {
        var waits = [];
        clients.forEach(function (client) {
          var path = "";
          try { path = new URL(client.url).pathname; } catch (e) { return; }
          if (path === "/iron-arc/" || path === "/iron-arc/index.html") {
            waits.push(client.navigate(client.url));
          }
        });
        return Promise.all(waits);
      })
      .then(function () { return self.registration.unregister(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request, { cache: "reload" }).catch(function () {
      return new Response(
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex, nofollow\"><title>404 \u2014 Not Found</title></head><body><h1>404 \u2014 Not Found</h1><p>The requested page does not exist.</p></body></html>",
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
          }
        }
      );
    })
  );
});
'@
}

function Get-GitHubToken {
  $env:GIT_TERMINAL_PROMPT = "0"
  $env:GCM_INTERACTIVE = "Never"
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "git"
  $psi.Arguments = "credential fill"
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi
  [void]$process.Start()
  $process.StandardInput.Write("protocol=https`nhost=github.com`n`n")
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  [void]$process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) {
    throw "git credential fill failed. Sign in with Git Credential Manager and run publish again."
  }
  $token = ""
  foreach ($line in ($stdout -split "`r?`n")) {
    if ($line.StartsWith("password=")) {
      $token = $line.Substring(9).Trim()
    }
  }
  if (-not $token) { throw "git credential-manager did not return a GitHub token." }
  return $token
}

function Update-GitHubPagesSource {
  param([string]$Token)
  $headers = @{
    Authorization          = "Bearer $Token"
    Accept                 = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent"           = "iron-arc-publish"
  }
  $uri = "https://api.github.com/repos/kenneth-codes-alot/iron-arc/pages"
  $body = @{
    build_type = "legacy"
    source     = @{
      branch = "gh-pages"
      path   = "/"
    }
  } | ConvertTo-Json -Depth 5 -Compress

  $exists = $true
  try {
    Invoke-RestMethod -Method Get -Uri $uri -Headers $headers | Out-Null
  } catch {
    $status = 0
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    if ($status -eq 404) { $exists = $false } else { throw }
  }

  $method = $(if ($exists) { "Put" } else { "Post" })
  $updated = Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
  $branch = $updated.source.branch
  $path = $updated.source.path
  if ($branch -ne "gh-pages" -or $path -ne "/") {
    throw "GitHub Pages did not switch to gh-pages / (got $branch $path)"
  }
  Write-Host "GitHub Pages source is gh-pages ($path)."
}

$origin = (& git remote get-url origin).Trim()
if ($origin -notmatch "kenneth-codes-alot/iron-arc(\.git)?$") {
  throw "Unexpected origin: $origin"
}
$branch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne "main") {
  throw "publish.ps1 must be run from main (current: $branch)"
}

Invoke-Git @("add", "-A")
$pending = @(git status --porcelain)
if ($pending.Count -gt 0) {
  Invoke-Git @("commit", "-m", $Message)
}
Invoke-Git @("push", "origin", "main")

$work = Join-Path $env:TEMP ("iron-arc-gh-pages-" + [guid]::NewGuid().ToString("N"))
try {
  $remoteGh = @(git ls-remote --heads origin gh-pages)
  $localGh = @(git branch --list gh-pages)
  if ($remoteGh.Count -gt 0) {
    Invoke-Git @("fetch", "origin", "gh-pages")
    Invoke-Git @("worktree", "add", "-B", "gh-pages", $work, "origin/gh-pages")
  } elseif ($localGh.Count -gt 0) {
    Invoke-Git @("worktree", "add", $work, "gh-pages")
  } else {
    Invoke-Git @("worktree", "add", "--detach", $work, "HEAD")
    Invoke-Git @("-C", $work, "checkout", "--orphan", "gh-pages")
  }

  Get-ChildItem -Force -LiteralPath $work | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force

  $decoy = Get-RootDecoyHtml
  if ($decoy -match "IRON ARC") { throw "Root decoy contains the product name." }
  if ($decoy -notmatch "noindex, nofollow") { throw "Root decoy is missing robots meta." }
  if ($decoy -notmatch "404 .+ Not Found") { throw "Root decoy is missing the 404 title." }
  Write-Utf8 (Join-Path $work "index.html") $decoy
  Write-Utf8 (Join-Path $work "404.html") $decoy
  Write-Utf8 (Join-Path $work "sw.js") (Get-RootKillerSw)
  Write-Utf8 (Join-Path $work ".nojekyll") ""

  $appDir = Join-Path $work "ia-v9x"
  New-Item -ItemType Directory -Path $appDir | Out-Null
  foreach ($name in $prodFiles) {
    $src = Join-Path $repoRoot $name
    if (-not (Test-Path -LiteralPath $src)) { throw "Missing production file: $name" }
    Copy-Item -LiteralPath $src -Destination (Join-Path $appDir $name)
  }
  $appHtml = Add-RobotsMeta ([System.IO.File]::ReadAllText((Join-Path $repoRoot "index.html")))
  if ($appHtml -notmatch "noindex, nofollow") { throw "Secret path index is missing robots meta." }
  Write-Utf8 (Join-Path $appDir "index.html") $appHtml

  Invoke-Git @("-C", $work, "add", "-A")
  $tree = (& git -C $work write-tree).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $tree) { throw "git write-tree failed" }
  $names = @(git -C $work ls-tree -r --name-only $tree | ForEach-Object { $_.Replace("\", "/").Trim() } | Where-Object { $_ })
  $required = @("index.html", "404.html", "sw.js", ".nojekyll") + @($prodFiles | ForEach-Object { "ia-v9x/$_" })
  foreach ($need in $required) {
    if ($names -notcontains $need) { throw "gh-pages tree is missing $need" }
  }
  $rootApps = @($names | Where-Object { $_ -notmatch "/" -and $_ -match "\.(js|css)$" -and $_ -ne "sw.js" })
  if ($rootApps.Count -gt 0) { throw "Refusing to publish app assets at gh-pages root: $($rootApps -join ', ')" }

  $ghStatus = @(git -C $work status --porcelain)
  if ($ghStatus.Count -gt 0) {
    Invoke-Git @("-C", $work, "commit", "-m", "Publish the static site and retire the previous root URL.")
  }
  Invoke-Git @("-C", $work, "push", "origin", "gh-pages")
} finally {
  Set-Location $repoRoot
  if ($work -and (Test-Path -LiteralPath $work)) {
    git worktree remove --force $work 2>$null | Out-Null
    if (Test-Path -LiteralPath $work) {
      Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  git worktree prune 2>$null | Out-Null
}

$token = Get-GitHubToken
Update-GitHubPagesSource -Token $token

Write-Host "=====================================================" -ForegroundColor Green
Write-Host " Pushed main and gh-pages." -ForegroundColor Green
Write-Host " Customer: https://kenneth-codes-alot.github.io/iron-arc/ia-v9x/?mode=prod" -ForegroundColor Cyan
Write-Host " Studio:   https://kenneth-codes-alot.github.io/iron-arc/ia-v9x/" -ForegroundColor Cyan
Write-Host " The old root URL is a dead 404 and clears the old cache." -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
