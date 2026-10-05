# Play, download, and publish Dawn of Warriors

## 1. Play in Arena now

Open the **Dawn of Warriors** live preview in the Arena conversation (port **3000**). If available, use **Open in new tab** for a larger game view. The preview is a development environment, not permanent public hosting.

You start with a real guest empire. To try the opening objectives:

1. Press **B**, choose **Farm**, then click an open spot near your capital.
2. Press **R**, recruit a **Legionary** cohort, and wait for training to finish.
3. Click your blue cohorts (Shift-click to select more), then **right-click** near Riverwatch to march. Soldiers fight automatically in range.
4. Use **Save progress**. Register before signing out if you want to retain access to your guest empire.

Drag to pan, scroll to zoom, Q/E to rotate. On a phone, choose **March** and then tap a destination. The pause button stops the world while you read menus.

## 2. Download and play on your own computer

The source ZIP contains the application, original assets, backend, tests, and setup files. It does **not** include dependencies, live player databases, passwords, or session cookies. It is source code, not a Windows installer or standalone executable.

1. Install **Node.js 22.13 or newer**; Node 22.22.3 is the tested version.
2. Extract the ZIP.
3. Open a terminal in the extracted folder containing `package.json`.
4. Run:

   ```sh
   npm ci
   npm run dev
   ```

5. Open **http://localhost:3002** in Chrome, Edge, Firefox, or another WebGL-capable browser.
6. Keep the terminal open while playing. Stop with **Ctrl+C**.

These development commands work on Windows, macOS, and Linux. Local player data is stored in `data/dawn.sqlite`. Do not delete that folder if you want to keep your local saves. Arena-preview saves are not included in the source ZIP; downloading starts a separate local installation.

The sign-in page checks its configured API origin, its own origin, then the local development server. If you host the frontend separately, set the `game-api-origin` meta tag in `auth.html` to the backend origin and set `CLIENT_ORIGINS` on the backend to the frontend's exact origin (scheme and host, without a trailing slash).

Without SMTP, development verification is provided by the clearly labeled local verification button; recovery messages are written to `data/mailbox.jsonl`.

## 3. Keep the code in GitHub

Repository:

https://github.com/jvnbasicitsolutionbusiness-create/Dawn-of-Warriors-Ancient-Times

The implementation is published on:

```text
arena/01a0e1c1-dawn-of-warriors-ancient-times
```

Use GitHub's branch selector to view that branch. Until its pull request is merged, the default `main` branch does not contain the game.

To download directly from GitHub, select the implementation branch and choose **Code → Download ZIP**. Review the pull request before merging it into `main` if you want the game to become the repository's default version.

### GitHub is not the game server

Pushing the source code to GitHub does **not** publish a live game. **GitHub Pages serves static sites and cannot run this Express backend or SQLite database.** Do not deploy only `dist/` to Pages: authentication, game commands, and saves would be missing.

## 4. Publish the full game using GitHub + Render

A `render.yaml` Blueprint is included for a single Node web service with a persistent disk. This is a **paid-service configuration**. Check the host's current price and your budget before creating it; pushing this repository does not create or pay for a service.

### Blueprint path

1. Create or sign in to your own Render account.
2. Connect your GitHub account to Render and authorize access to this repository.
3. Choose **New → Blueprint** and select the repository and implementation branch shown above.
4. Review the configuration and costs. It specifies one service, a persistent disk, and manual deployment rather than automatic deployment on every commit.
5. Set `APP_URL` to the public HTTPS URL you intend to use. If Render assigns a different URL during creation, update `APP_URL` to the actual URL shown in its dashboard **before enabling email registration**.
6. Create the service only when you are comfortable with the cost.
7. Wait for the build and `/api/health` health check to succeed, then open the public HTTPS service URL.

### Equivalent manual web-service settings

If you prefer to create a web service manually instead of importing the Blueprint:

| Setting               | Value                                                  |
| --------------------- | ------------------------------------------------------ |
| Source                | This GitHub repository                                 |
| Branch                | `arena/01a0e1c1-dawn-of-warriors-ancient-times`        |
| Runtime               | Node                                                   |
| Node version          | `22.22.3`                                              |
| Build command         | `npm ci --include=dev && npm run build`                |
| Start command         | `npm start`                                            |
| Health check          | `/api/health`                                          |
| Instances             | **1**                                                  |
| Persistent disk mount | `/var/data`                                            |
| `NODE_ENV`            | `production`                                           |
| `DB_PATH`             | `/var/data/dawn.sqlite`                                |
| `APP_URL`             | Your actual public HTTPS URL, without a trailing slash |

Use a plan that supports a persistent disk. Without persistent storage, account and game data can disappear on restart or redeployment. Back up the database using the host's disk backups or SQLite's backup facilities; do not commit it to GitHub. The current simulation is not designed for horizontal scaling across multiple server instances.

### Email accounts on your public site

Guest play works without email configuration. **Production registration and account recovery need a real email provider.** Configure provider credentials in the hosting dashboard, never in GitHub or frontend code.

For Gmail, enable 2-Step Verification on the sending Google account and create an **App Password**. A normal Gmail password will not work. Add these environment variables:

```text
GMAIL_USER              Your sending Gmail address
GMAIL_APP_PASSWORD     The 16-character Google App Password
MAIL_FROM              Dawn of Warriors <same-sending-address@gmail.com>
APP_URL                 https://your-actual-public-game-url
```

The server uses Gmail SMTP over TLS and sends a clickable one-time verification link. Clicking it activates the account and opens the game. Gmail may limit automated sending; for a public game, a transactional email provider and verified sending domain are more reliable.

For another SMTP provider, use:

```text
SMTP_HOST       Your provider's SMTP server
SMTP_PORT       Usually 587 (STARTTLS), or 465 (TLS)
SMTP_USER       Your provider's SMTP username
SMTP_PASSWORD   Your provider's SMTP credential
MAIL_FROM       Dawn of Warriors <noreply@your-verified-domain.example>
```

Use a sender/domain authorized by your provider. The development verification button is disabled in production. Test verification, password recovery, and persistence before inviting players.

Do not paste hosting passwords, SMTP passwords, or other secrets into chat. Configure them directly in your own provider dashboard.

## 5. Updating the hosted game

Push changes to the implementation branch, run the tests, then use the host's manual deployment control. If you merge the pull request and later want the host to track `main`, change the service's source branch in your hosting dashboard yourself; preserve the persistent disk and environment variables.

## Release expectations

This is the playable v0.1.0 foundation, not a finished commercial-scale game. See `README.md` for implemented features, known limits, security notes, and the next development phases. In particular, 2FA, advanced AI economies, separate large regional maps, and full 3D story cinematics are not implemented yet.

Configuration reference: [Render Blueprint YAML documentation](https://render.com/docs/blueprint-spec). The included configuration selects the `0.5c-512mb` compute plan and Singapore region; review availability and current costs in the host dashboard.
