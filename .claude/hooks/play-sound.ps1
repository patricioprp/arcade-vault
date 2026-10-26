$ErrorActionPreference = 'SilentlyContinue'
$mp3 = 'C:\Users\ppolito\Desktop\Claude code\kOh5UdeZSea3BrXsNmYo_claudecode-finished.mp3'
if (-not (Test-Path $mp3)) { exit 0 }

Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([uri]$mp3)
$player.Volume = 0.15  # 0.0 a 1.0; el valor por defecto es 0.5
$player.Play()

# Espera a que cargue la duración y deja sonar el audio completo (máx. 10 s)
$i = 0
while (-not $player.NaturalDuration.HasTimeSpan -and $i -lt 20) { Start-Sleep -Milliseconds 100; $i++ }
$secs = if ($player.NaturalDuration.HasTimeSpan) { [Math]::Min($player.NaturalDuration.TimeSpan.TotalSeconds, 10) } else { 3 }
Start-Sleep -Milliseconds ([int]($secs * 1000) + 200)
$player.Close()
exit 0
