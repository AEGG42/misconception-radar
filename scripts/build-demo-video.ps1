param(
  [string]$FfmpegPath = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot "artifacts\video"
$audioDir = Join-Path $outputDir "audio"
$outputPath = Join-Path $outputDir "misconception-radar-demo.mp4"
$captionPath = Join-Path $outputDir "captions.srt"

if ([string]::IsNullOrWhiteSpace($FfmpegPath)) {
  $FfmpegPath = Join-Path $env:TEMP "misconception-video-tools\node_modules\ffmpeg-static\ffmpeg.exe"
}
if (-not (Test-Path -LiteralPath $FfmpegPath -PathType Leaf)) {
  throw "ffmpeg was not found. Install ffmpeg-static in the temporary video-tools prefix or pass -FfmpegPath."
}

New-Item -ItemType Directory -Force -Path $outputDir, $audioDir | Out-Null
& node (Join-Path $PSScriptRoot "render-video-assets.mjs") $outputDir
if ($LASTEXITCODE -ne 0) {
  throw "Video overlay rendering failed."
}

$segments = @(
  [pscustomobject]@{
    StartMs = 0
    EndMs = 9000
    Text = "Twenty exit tickets. Ten minutes before class. Who got it wrong is easy. What does the class misunderstand?"
  },
  [pscustomobject]@{
    StartMs = 9000
    EndMs = 20000
    Text = "Misconception Radar turns short physics answers into an evidence-backed misconception map and a targeted reteach plan."
  },
  [pscustomobject]@{
    StartMs = 20000
    EndMs = 33000
    Text = "I choose a bounded Newton's third-law prompt and load eight synthetic responses. Names stay in this browser; only anonymous IDs and answers are analyzed."
  },
  [pscustomobject]@{
    StartMs = 33000
    EndMs = 40000
    Text = "DeepSeek compares each explanation with a teacher-reviewed rubric and misconception taxonomy."
  },
  [pscustomobject]@{
    StartMs = 40000
    EndMs = 58000
    Text = "Now I can see the class pattern: mastery, draft scores, review flags, and the most common underlying ideas, not just right and wrong."
  },
  [pscustomobject]@{
    StartMs = 58000
    EndMs = 73000
    Text = "Three students are using mass to decide the size of an interaction force. The count is recomputed in code from student-level results."
  },
  [pscustomobject]@{
    StartMs = 73000
    EndMs = 91000
    Text = "For Maya, the diagnosis is tied to her exact words. I can inspect the rubric, edit the feedback draft, and approve it. Nothing is sent automatically."
  },
  [pscustomobject]@{
    StartMs = 91000
    EndMs = 104000
    Text = "One click turns the class's top signal into a five-minute teaching move, a force-diagram task, and a new exit ticket."
  },
  [pscustomobject]@{
    StartMs = 104000
    EndMs = 111000
    Text = "Bounded labels. Structured DeepSeek. Evidence checks. Names stay in the browser."
  },
  [pscustomobject]@{
    StartMs = 111000
    EndMs = 114000
    Text = "Misconception Radar."
  }
)

function Format-SrtTime([int]$milliseconds) {
  $time = [TimeSpan]::FromMilliseconds($milliseconds)
  return "{0:00}:{1:00}:{2:00},{3:000}" -f [math]::Floor($time.TotalHours), $time.Minutes, $time.Seconds, $time.Milliseconds
}

function Wrap-Caption([string]$text, [int]$width = 72) {
  $lines = New-Object System.Collections.Generic.List[string]
  $current = ""
  foreach ($word in $text.Split(" ")) {
    $candidate = if ($current) { "$current $word" } else { $word }
    if ($candidate.Length -gt $width -and $current) {
      $lines.Add($current)
      $current = $word
    } else {
      $current = $candidate
    }
  }
  if ($current) {
    $lines.Add($current)
  }
  return $lines -join "`n"
}

$captionBuilder = New-Object System.Text.StringBuilder
$captionSegments = @($segments | Select-Object -First 9)
for ($index = 0; $index -lt $captionSegments.Count; $index++) {
  $segment = $captionSegments[$index]
  [void]$captionBuilder.AppendLine(($index + 1).ToString())
  [void]$captionBuilder.AppendLine("$(Format-SrtTime $segment.StartMs) --> $(Format-SrtTime $segment.EndMs)")
  [void]$captionBuilder.AppendLine((Wrap-Caption $segment.Text))
  [void]$captionBuilder.AppendLine()
}
[System.IO.File]::WriteAllText(
  $captionPath,
  $captionBuilder.ToString(),
  [System.Text.UTF8Encoding]::new($false)
)

$voice = New-Object -ComObject SAPI.SpVoice
$voice.Voice = $voice.GetVoices().Item(0)
$voice.Rate = 2
$voice.Volume = 100

$audioPaths = @()
for ($index = 0; $index -lt $segments.Count; $index++) {
  $audioPath = Join-Path $audioDir ("segment-{0:00}.wav" -f ($index + 1))
  $stream = New-Object -ComObject SAPI.SpFileStream
  $format = New-Object -ComObject SAPI.SpAudioFormat
  $format.Type = 22
  $stream.Format = $format
  $stream.Open($audioPath, 3, $false)
  $voice.AudioOutputStream = $stream
  [void]$voice.Speak($segments[$index].Text)
  $stream.Close()
  $audioPaths += $audioPath
}

$visuals = @(
  [pscustomobject]@{ Path = (Join-Path $projectRoot "public\devpost-thumbnail.png"); Duration = 9 },
  [pscustomobject]@{ Path = (Join-Path $projectRoot "public\screenshots\01-class-responses.png"); Duration = 31 },
  [pscustomobject]@{ Path = (Join-Path $projectRoot "public\screenshots\02-diagnostic-map.png"); Duration = 33 },
  [pscustomobject]@{ Path = (Join-Path $projectRoot "public\screenshots\03-reteach-and-feedback.png"); Duration = 31 },
  [pscustomobject]@{ Path = (Join-Path $outputDir "architecture.png"); Duration = 7 },
  [pscustomobject]@{ Path = (Join-Path $outputDir "end-card.png"); Duration = 3 }
)

$ffmpegArguments = @("-y", "-hide_banner", "-loglevel", "warning")
foreach ($visual in $visuals) {
  $ffmpegArguments += @("-loop", "1", "-t", $visual.Duration.ToString(), "-i", $visual.Path)
}
foreach ($audioPath in $audioPaths) {
  $ffmpegArguments += @("-i", $audioPath)
}
$ffmpegArguments += @("-f", "lavfi", "-t", "114", "-i", "anullsrc=r=44100:cl=mono")

$videoFilters = @()
for ($index = 0; $index -lt $visuals.Count; $index++) {
  $videoFilters += "[$index`:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0b2723,setsar=1,fps=30,format=yuv420p[v$index]"
}
$videoInputs = (0..($visuals.Count - 1) | ForEach-Object { "[v$_]" }) -join ""
$videoFilters += "${videoInputs}concat=n=$($visuals.Count):v=1:a=0[base]"
$videoFilters += "[base]subtitles=captions.srt:force_style='FontName=Arial,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=28'[vout]"

$audioFilters = @()
for ($index = 0; $index -lt $segments.Count; $index++) {
  $inputIndex = $visuals.Count + $index
  $audioFilters += "[$inputIndex`:a]adelay=$($segments[$index].StartMs):all=1[a$index]"
}
$silentInputIndex = $visuals.Count + $segments.Count
$audioInputs = (0..($segments.Count - 1) | ForEach-Object { "[a$_]" }) -join ""
$audioFilters += "${audioInputs}[$silentInputIndex`:a]amix=inputs=$($segments.Count + 1):duration=longest:dropout_transition=0,atrim=duration=114,loudnorm=I=-14:TP=-1.5:LRA=11[aout]"

$filterGraph = ($videoFilters + $audioFilters) -join ";"
$ffmpegArguments += @(
  "-filter_complex", $filterGraph,
  "-map", "[vout]",
  "-map", "[aout]",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "20",
  "-r", "30",
  "-c:a", "aac",
  "-b:a", "192k",
  "-ar", "48000",
  "-movflags", "+faststart",
  "-t", "114",
  $outputPath
)

Push-Location $outputDir
try {
  & $FfmpegPath @ffmpegArguments
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

$output = Get-Item -LiteralPath $outputPath
[pscustomobject]@{
  output = $output.FullName
  bytes = $output.Length
  targetDurationSeconds = 114
  resolution = "1920x1080"
} | ConvertTo-Json -Compress
