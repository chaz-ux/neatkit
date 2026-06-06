# NeatKit

NeatKit is a browser-based toolbox built for fast, private, everyday utility work.
It focuses on tasks that should happen locally in your browser instead of on a server.

## What the site does

The homepage introduces the toolkit and links into the available utilities.
Each tool lives in the `tools/` folder and shares common styling from `assets/`.

### Tool areas

- **Image**: image compression, resizing, and image-to-PDF conversion
- **PDF**: PDF merge/split, images-to-PDF, ID card to PDF, photo to scanned PDF
- **Text**: word counter and case converter
- **Conversion**: unit conversion, color conversion, Base64 encoding and decoding
- **Data / Dev**: JSON formatter and other small developer helpers

## Run locally

Use the bundled PowerShell launcher to start a local server and Cloudflare tunnel:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local-tunnel.ps1
```

That script will:

- start a local HTTP server on `http://localhost:8000`
- launch a Cloudflare quick tunnel
- print a public `trycloudflare.com` link you can share

If you only want to verify that the launcher resolves the right tools, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local-tunnel.ps1 -DryRun
```

To stop the background processes later:

```powershell
Stop-Process -Id (Get-Content .\python-server.pid) -Force
Stop-Process -Id (Get-Content .\cloudflared.pid) -Force
```

## Requirements

- Windows PowerShell
- Python 3 or the `py` launcher
- `cloudflared`

If `cloudflared` is missing, install it with Chocolatey:

```powershell
choco install cloudflared -y
```

## Contributing

If you want to work on the site from your own machine:

```powershell
git clone https://github.com/Neat-Kit/NeatKit.git
cd NeatKit
```

If you are contributing through a fork, set your remotes like this:

```powershell
git remote add upstream https://github.com/Neat-Kit/NeatKit.git
git remote -v
```

### Keeping your branch up to date

Before you start new work, pull the latest changes:

```powershell
git checkout main
git pull upstream main
```

If you are working on your own branch:

```powershell
git checkout -b my-feature
git push -u origin my-feature
```

### Typical pull and push flow

1. Make your changes.
2. Check what changed with `git status`.
3. Stage and commit your work.
4. Pull the latest remote updates if needed.
5. Push your branch back to GitHub.

Example:

```powershell
git add .
git commit -m "Describe your change"
git pull --rebase
git push
```

### Contribution guidelines

- Open an issue first if you want to discuss a larger change or new tool.
- Keep pull requests focused on one feature, fix, or content update.
- Use clear commit messages that explain what changed.
- Rebase or pull from `upstream/main` before opening a pull request.
- Test the page locally before pushing so the static site still works.
- Update `README.md` or related docs when you add or change a tool.

## Project files

- `index.html` — homepage and entry point
- `tools/` — the individual utilities
- `assets/` — shared CSS and JavaScript
- `locales/` — language files
- `start-local-tunnel.ps1` — local server + tunnel launcher

## Notes

- The tunnel is best for quick sharing and testing, not permanent hosting.
- Keep the PowerShell window open while the tunnel is in use.
- If you push changes to GitHub, restart the launcher so the tunnel serves your latest files.