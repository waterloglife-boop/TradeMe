Add-Type -AssemblyName System.Drawing

$iconDir = Join-Path $PSScriptRoot "icons"
if (!(Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force | Out-Null
}

function Create-Icon([int]$size, [string]$filename) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::Transparent)

    # Gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $c1 = [System.Drawing.Color]::FromArgb(255, 255, 107, 53)  # #ff6b35
    $c2 = [System.Drawing.Color]::FromArgb(255, 255, 142, 83)  # #ff8e53
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)

    # Rounded rectangle path
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = [int]($size * 0.22)
    if ($radius -lt 2) { $radius = 2 }
    $d = $radius * 2
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($size - $d - 1, 0, $d, $d, 270, 90)
    $path.AddArc($size - $d - 1, $size - $d - 1, $d, $d, 0, 90)
    $path.AddArc(0, $size - $d - 1, $d, $d, 90, 90)
    $path.CloseFigure()

    $g.FillPath($brush, $path)

    # Inner speech bubble or text
    if ($size -ge 48) {
        # Draw speech bubble
        $bubbleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $bw = [int]($size * 0.65)
        $bh = [int]($size * 0.5)
        $bx = [int](($size - $bw) / 2)
        $by = [int]($size * 0.18)
        $bRadius = [int]($size * 0.12)
        $bd = $bRadius * 2

        $bpath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $bpath.AddArc($bx, $by, $bd, $bd, 180, 90)
        $bpath.AddArc($bx + $bw - $bd, $by, $bd, $bd, 270, 90)
        $bpath.AddArc($bx + $bw - $bd, $by + $bh - $bd, $bd, $bd, 0, 90)
        $bpath.AddArc($bx, $by + $bh - $bd, $bd, $bd, 90, 90)
        $bpath.CloseFigure()
        $g.FillPath($bubbleBrush, $bpath)

        # Bubble tail
        $p1 = New-Object System.Drawing.PointF([float]($bx + $bw * 0.3), [float]($by + $bh - 1))
        $p2 = New-Object System.Drawing.PointF([float]($bx + $bw * 0.2), [float]($by + $bh + $size * 0.16))
        $p3 = New-Object System.Drawing.PointF([float]($bx + $bw * 0.55), [float]($by + $bh - 1))
        $g.FillPolygon($bubbleBrush, [System.Drawing.PointF[]]@($p1, $p2, $p3))

        # 'AI' text inside bubble
        $font = New-Object System.Drawing.Font("Segoe UI", [float]($size * 0.22), [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 107, 53))
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $textRect = New-Object System.Drawing.RectangleF([float]$bx, [float]$by, [float]$bw, [float]$bh)
        $g.DrawString("AI", $font, $textBrush, $textRect, $sf)
    } else {
        # 16px size: simplified bold 'AI'
        $font = New-Object System.Drawing.Font("Segoe UI", 7.0, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $textRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
        $g.DrawString("AI", $font, $textBrush, $textRect, $sf)
    }

    $outPath = Join-Path $iconDir $filename
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $filename at $outPath"
}

Create-Icon 16 "icon16.png"
Create-Icon 48 "icon48.png"
Create-Icon 128 "icon128.png"
