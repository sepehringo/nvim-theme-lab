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

## Create your own theme

Open [Neovim Theme Lab](https://sepehringo.github.io/nvim-theme-lab/) to customize your colors, preview your theme, and export it for Neovim. No installation required.

## Development

Built with React, TypeScript, Tailwind CSS, and Vite. Run `npm run lint` to check the code. The original Vinext/Cloudflare setup remains available through `npm run dev`, `npm run build`, and `npm start`; GitHub Pages uses the separate static build above.
