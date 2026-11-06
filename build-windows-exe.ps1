$ErrorActionPreference = 'Stop'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) {
  throw "No se encontró el compilador .NET Framework: $compiler"
}
if (-not (Test-Path -LiteralPath 'runtime\node.exe')) {
  $nodeCommand = Get-Command node -ErrorAction Stop
  New-Item -ItemType Directory -Path 'runtime' -Force | Out-Null
  Copy-Item -LiteralPath $nodeCommand.Source -Destination 'runtime\node.exe' -Force
}
& $compiler /nologo /target:winexe /out:ColorLink.exe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll ColorLinkLauncher.cs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Generado ColorLink.exe. Coloca .env.local junto al ejecutable.'
