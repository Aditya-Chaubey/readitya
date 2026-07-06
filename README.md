# ~/portfolio

An interactive, console-themed portfolio site. Pure HTML/CSS/JS — no build step, no dependencies. Drop it on GitHub Pages and point your domain at it.

## Pages
- `index.html` — home. An interactive command prompt: type `about`, `projects`, `contact`, `help`, `ls`, `whoami`, `clear` (or click a chip). Supports ↑/↓ history and Tab autocomplete.
- `about.html` — bio (2 placeholder paragraphs) + placeholder portrait.
- `projects.html` — file-explorer browser. Click an entry or use ↑/↓ to inspect each project.
- `contact.html` — contact channels (click email/phone to copy, links open in a new tab).

## Structure
```
portfolio/
├── index.html  about.html  projects.html  contact.html
├── css/style.css        # full design system
├── js/
│   ├── main.js          # shared chrome: topbar, clock, scramble hover, reveal
│   ├── terminal.js      # home command prompt
│   ├── projects.js      # project explorer + PROJECTS data
│   └── contact.js       # copy-to-clipboard
├── assets/              # put your portrait + images here
├── CNAME                # your custom domain
└── .nojekyll            # tells Pages to serve files as-is
```

## Editing content
- **Projects:** edit the `PROJECTS` array at the top of `js/projects.js`.
- **Bio:** edit the two `<p>` blocks in `about.html`.
- **Photo:** drop an image in `assets/` and replace the `.photo__frame` block in `about.html` with `<img src="assets/your-photo.jpg" ... >`.
- **Contact:** edit the `data-copy` / `data-href` and visible text in `contact.html`.
- **Accent color:** change `--accent` in `css/style.css` (`:root`).

## Deploy to GitHub Pages
1. Create a repo and push these files to the **root** (not a subfolder):
   ```bash
   git init
   git add .
   git commit -m "portfolio site"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save.
3. **Custom domain:** put your real domain in the `CNAME` file (one line, e.g. `example.com`), commit it. Then in Settings → Pages add the same domain. At your DNS registrar:
   - Apex domain (`example.com`): add 4 `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - `www` subdomain: add a `CNAME` record → `<you>.github.io`.
4. Wait for DNS to propagate, then enable **Enforce HTTPS**.

## Local preview
Just open `index.html` in a browser, or run a tiny server (clipboard copy needs http/https on some browsers):
```bash
python -m http.server 8080
# → http://localhost:8080
```
