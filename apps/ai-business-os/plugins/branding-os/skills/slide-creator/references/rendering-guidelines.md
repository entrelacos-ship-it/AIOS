# Rendering Guidelines

Use this reference when building or updating BrandingOS slide assets rendered from HTML/CSS.

## Core Workflow

1. Generate HTML

Write a complete, self-contained HTML file with inline CSS. HTML is design source of truth. Embed layout, typography, spacing, colors, and content directly in file.

2. Save HTML

Write one file per slide, for example:
- `output/slides/slide-01.html`
- `output/slides/slide-02.html`

3. Start local HTTP server when browser cannot reliably open local files

PowerShell:

```powershell
$outputDir = "OUTPUT_DIR"
$server = Start-Process python -ArgumentList "-m","http.server","8765","--directory",$outputDir -PassThru -WindowStyle Hidden
for ($i = 0; $i -lt 30; $i++) {
  try {
    Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8765/" | Out-Null
    break
  } catch {
    Start-Sleep -Milliseconds 100
  }
}
```

POSIX shell:

```bash
python -m http.server 8765 --directory "OUTPUT_DIR" &
for i in $(seq 1 30); do curl -s http://localhost:8765 > /dev/null 2>&1 && break || sleep 0.1; done
```

4. Render

Use Playwright to:
- navigate to rendered slide URL
- resize viewport to target dimensions
- take PNG screenshot

If using local HTTP server, navigate with filename only, for example:
- `http://127.0.0.1:8765/slide-01.html`

5. Verify

Inspect first screenshot before batch rendering all slides. Re-render after fixing HTML if text clips, contrast fails, or crop feels wrong.

6. Stop server

PowerShell:

```powershell
if ($server -and !$server.HasExited) {
  Stop-Process -Id $server.Id
}
```

POSIX shell:

```bash
pkill -f "http.server 8765" 2>/dev/null || true
```

## Viewport Presets

| Format | Width | Height |
|---|---:|---:|
| Instagram Post | 1080 | 1080 |
| Instagram Carousel | 1080 | 1440 |
| Instagram Story / Reel | 1080 | 1920 |
| Facebook Post | 1200 | 630 |
| Twitter / X Post | 1200 | 675 |
| LinkedIn Post | 1200 | 627 |
| YouTube Thumbnail | 1280 | 720 |
| Custom | user-defined | user-defined |

## HTML Template Rules

Every HTML file must:
- be self-contained, with inline CSS
- use web-safe fonts or Google Fonts via `@import`
- embed images as absolute paths or base64 data URIs
- set exact `body` dimensions matching viewport
- use `margin: 0; padding: 0; overflow: hidden` on `body`
- account for device pixel ratio only when higher-resolution capture is required

Minimal structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1080px; height: 1440px; overflow: hidden; }
  </style>
</head>
<body>
  <!-- slide content -->
</body>
</html>
```

## Batch Rendering

For carousels and multi-slide outputs:
1. Generate one HTML file per slide.
2. Start HTTP server once before batch, if needed.
3. Render slides sequentially.
4. Stop HTTP server once after batch.
5. Name outputs with zero-padded numbers.
6. Keep viewport dimensions identical across whole set.

## Best Practices

- Verify first rendered image before running full batch.
- Prefer CSS Grid and Flexbox for layout.
- Avoid animations and transitions.
- Use `border-radius` plus `overflow: hidden` for rounded image masks.
- Rely on system emoji font when emoji must render.
- Test text overflow deliberately.
- Keep HTML files alongside PNGs for fast rerender.

## Typography And Readability Rules

Readable text in HTML and inline SVG must respect these minimums. Text inside linked or embedded image assets is decorative and exempt.

Universal minimum:
- no readable text below `20px`

Minimum font sizes by platform:

| Text Role | Instagram Post / Carousel | Instagram Story / Reel | LinkedIn / Facebook | YouTube Thumb |
|---|---:|---:|---:|---:|
| Hero / Display | 58px | 56px | 40px | 60px |
| Heading | 43px | 42px | 32px | 36px |
| Body / Bullets | 34px | 32px | 24px | 36px |
| Caption / Footer | 24px | 20px | 20px | 32px |

Font weight rules:
- body text and above: `500+`
- caption text: `500+` preferred
- `400` allowed only when background contrast is at least `4.5:1`
- never use thin or light weights (`100-300`) for readable text

## Verification Checklist

Before final screenshot:
- every readable text element uses explicit `px` sizes
- no heading falls below heading minimum
- no body or bullet text falls below body minimum
- no footer or metadata text falls below caption minimum
- no readable text uses font-weight below `500`, except caption with verified `4.5:1` contrast
- no text is clipped or hidden
- no critical element touches unsafe edge area
