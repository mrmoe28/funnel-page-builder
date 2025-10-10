# Funnel Page Builder

**URL → Funnel Generator**: Paste a URL, generate a static funnel splash page with screenshots, SEO meta, and CTA with UTM passthrough.

## Features

- 🎨 **One-Click Generation**: Input a URL and get a beautiful funnel page
- 📸 **Automated Screenshots**: Desktop & mobile screenshots via Playwright
- 🚀 **Deploy to GitHub Pages**: One-click deployment with automatic Pages setup
- 📦 **Download ZIP**: Host anywhere with a simple ZIP download
- 🎯 **UTM Preservation**: CTA buttons preserve query params and UTM tags
- 🎨 **Customizable**: Brand colors, logos, taglines, and more
- 📱 **Responsive**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Screenshots**: Playwright + @sparticuz/chromium (Vercel-compatible)
- **Deploy**: Octokit (GitHub API)
- **ZIP**: Archiver

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/mrmoe28/funnel-page-builder.git
cd funnel-page-builder
npm install
```

### 2. Configure Environment

Create `.env.local` from the template:

```bash
# Required for GitHub Pages deployment
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_USERNAME=your-github-username

# Exposed to client (optional)
NEXT_PUBLIC_GITHUB_USERNAME=your-github-username
NEXT_PUBLIC_DEFAULT_PRIMARY=#0ea5e9
NEXT_PUBLIC_DEFAULT_BG=#0b1220
```

**Getting a GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo` (full control of private repositories)
4. Copy token and add to `.env.local`

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Usage

### Generate a Funnel

1. **Enter Details**:
   - App Name (required)
   - Target URL (required) - The URL you want to funnel to
   - Tagline, Subhead (optional)
   - Brand colors (optional)
   - Logo URL (optional)

2. **Click "Generate"**: The app will:
   - Visit your target URL with Playwright
   - Capture desktop (1440x900) and mobile (iPhone 14 Pro) screenshots
   - Extract meta tags (title, description)
   - Generate a static HTML funnel page
   - Show live preview

3. **Deploy or Download**:
   - **Deploy to GitHub Pages**: Creates a new repo, pushes content, enables Pages
   - **Download ZIP**: Get all files to host anywhere (Netlify, Vercel, etc.)

## Project Structure

```
funnel-page-builder/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main UI (form + preview)
│   └── api/
│       ├── generate/           # POST /api/generate (Playwright)
│       ├── deploy/github/      # POST /api/deploy/github (Octokit)
│       └── download-zip/       # POST /api/download-zip (Archiver)
├── components/
│   └── Preview.tsx             # Iframe preview component
├── lib/
│   ├── slug.ts                 # Slugify utility
│   ├── ensureChromium.ts       # Playwright browser launcher
│   └── github.ts               # GitHub API helpers (Octokit)
├── styles/
│   └── globals.css             # Tailwind base styles
├── public/
│   └── funnels/                # Generated funnel pages (gitignored)
└── README.md
```

## API Routes

### `POST /api/generate`

**Request:**
```json
{
  "appName": "My App",
  "targetUrl": "https://example.com",
  "tagline": "The best app ever",
  "subhead": "Try it now",
  "primary": "#0ea5e9",
  "bg": "#0b1220",
  "logoUrl": "https://example.com/logo.svg"
}
```

**Response:**
```json
{
  "slug": "my-app",
  "previewUrl": "/funnels/my-app/",
  "meta": {
    "title": "My App",
    "description": "The best app ever"
  },
  "paths": {
    "desktop": "/funnels/my-app/assets/screenshot-desktop.png",
    "mobile": "/funnels/my-app/assets/screenshot-mobile.png"
  }
}
```

### `POST /api/deploy/github`

**Request:**
```json
{
  "slug": "my-app",
  "repoName": "funnel-my-app",
  "githubUsername": "yourusername",
  "customDomain": "funnel.yourdomain.com" // optional
}
```

**Response:**
```json
{
  "url": "https://yourusername.github.io/funnel-my-app/"
}
```

### `POST /api/download-zip`

**Request:**
```json
{
  "slug": "my-app"
}
```

**Response:** Binary ZIP file download

## Deployment

### Deploy This Builder to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `GITHUB_TOKEN`
- `GITHUB_USERNAME`
- `NEXT_PUBLIC_GITHUB_USERNAME`

### Serverless Considerations

The app automatically detects Vercel/serverless environments and uses `@sparticuz/chromium` for Playwright compatibility.

## Development

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # ESLint
npm run lint:format  # Prettier format
```

### Adding Features

1. **Custom Analytics**: Add tracking code to the generated HTML template in `app/api/generate/route.ts`
2. **More Deploy Targets**: Create new routes like `app/api/deploy/vercel/route.ts`
3. **Template Variations**: Modify HTML template or create multiple templates

## Troubleshooting

### Playwright Installation Issues

If Playwright browsers don't install:

```bash
npx playwright install --with-deps chromium
```

### GitHub Deployment Fails

- Verify `GITHUB_TOKEN` has `repo` scope
- Check GitHub username is correct
- Ensure token hasn't expired

### Screenshots Timeout

- Target URL might be slow or unreachable
- Check URL is publicly accessible
- Increase timeout in `app/api/generate/route.ts` (default 60s)

## License

MIT License - See LICENSE file

## Author

**mrmoe28**
- GitHub: [@mrmoe28](https://github.com/mrmoe28)

## Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ using Next.js, Playwright, and Tailwind CSS**
