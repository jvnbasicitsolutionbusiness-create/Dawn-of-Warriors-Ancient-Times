# Publish Dawn of Warriors with GitHub Pages

This repository now builds as a static website. GitHub Pages serves the game
directly; it does not need an always-running Node.js or Express server, and
players do not run `npm run dev`.

## Enable GitHub Pages

1. Push the repository and the `.github/workflows/pages.yml` workflow to GitHub.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish.
5. Open the Pages URL shown in **Settings → Pages**. For this repository it
   will normally be `https://jvnbasicitsolutionbusiness-create.github.io/Dawn-of-Warriors-Ancient-Times/`.

Future pushes to `main` will build and deploy the static site automatically.
Open the published Pages URL to play: the site automatically shows the loading
screen, local profile page, and game. GitHub Actions uses Node.js only to build
the static files in `dist/`; no Node.js or Express server runs on the published
site, and players do not need to run a command or install anything.

## Source development (optional)

These commands are only for contributors changing the source code. They are
not needed to play the published game. Install Node.js 22.13 or newer, then
run:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. This is only for development; the deployed
GitHub Pages site has its own public URL and works without a local server.

## Local profiles, saves, and limitations

Commander profiles, game progress, and preferences are saved in the browser's
local storage. They are specific to that browser and website origin; they do
not sync between devices or browsers. Clearing site data removes local
profiles and saves. Profiles are not secure online accounts: this static game
has no server, password authentication, email verification, password recovery,
database saves, or server multiplayer.
