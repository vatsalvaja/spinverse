# Renders TEMPORARY placeholder announcer clips for Pharaoh's Fortune with the Windows desktop voices.
# These are stand-ins: swap the files in public/audio/pharaohs-fortune/voice/ for professional recordings
# (same names, WAV or change the extension in src/games/pharaohs-fortune/audioManifest.ts).
#
#   powershell -ExecutionPolicy Bypass -File scripts/audio/voice.ps1
Add-Type -AssemblyName System.Speech
$out = Join-Path $PSScriptRoot "..\..\public\audio\pharaohs-fortune\voice"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$clips = @(
  @{ file = "good-luck";  voice = "Microsoft Zira Desktop";  rate = "medium"; pitch = "+8%";  text = "Good luck!" },
  @{ file = "nice-win";   voice = "Microsoft Zira Desktop";  rate = "fast";   pitch = "+12%"; text = "Nice win!" },
  @{ file = "big-win";    voice = "Microsoft David Desktop"; rate = "medium"; pitch = "-6%";  text = "Biiig win!" },
  @{ file = "super-win";  voice = "Microsoft David Desktop"; rate = "medium"; pitch = "-10%"; text = "Super win!" },
  @{ file = "mega-win";   voice = "Microsoft David Desktop"; rate = "slow";   pitch = "-16%"; text = "Meeega win!" },
  @{ file = "jackpot";    voice = "Microsoft David Desktop"; rate = "slow";   pitch = "-20%"; text = "Jaaackpot!" },
  @{ file = "free-spins"; voice = "Microsoft Zira Desktop";  rate = "medium"; pitch = "+4%";  text = "Free spins!" }
)

foreach ($c in $clips) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.Volume = 100
  $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
  $path = Join-Path $out ($c.file + ".wav")
  $s.SetOutputToWaveFile($path, $fmt)
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='" + $c.voice + "'><prosody rate='" + $c.rate + "' pitch='" + $c.pitch + "' volume='loud'><emphasis level='strong'>" + $c.text + "</emphasis></prosody></voice></speak>"
  $s.SpeakSsml($ssml)
  $s.Dispose()
  Write-Output ("{0}  {1:N0} bytes" -f $path, (Get-Item $path).Length)
}
