# Neovim Theme Lab

A browser-based editor to preview and customize Neovim colorschemes. Choose a theme, adjust its palette with live code previews, import theme data, and export JSON or a lazy.nvim configuration.

![Neovim Theme Lab preview](app%20view.png)

## Run locally

Install Node.js **22.13 or newer**, then run:

```sh
npm ci
npm run dev:pages
```

Open the local URL printed in the terminal (usually `http://localhost:5173`).

To build and preview the static production app:

```sh
npm run build:pages
npm run preview:pages
```

## Publish on GitHub Pages

1. Push this project to a GitHub repository with a `main` branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. In **Actions**, run **Deploy to GitHub Pages**, or push a commit to `main`.

The included workflow builds and publishes the app and handles the repository URL path automatically. The live URL appears in the deployment and Pages settings. No backend or API keys are required.

See [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Development

Built with React, TypeScript, Tailwind CSS, and Vite. Run `npm run lint` to check the code. The original Vinext/Cloudflare setup remains available through `npm run dev`, `npm run build`, and `npm start`; GitHub Pages uses the separate static build above.
