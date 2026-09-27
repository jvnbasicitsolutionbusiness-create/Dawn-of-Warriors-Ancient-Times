# Dawn of Warriors: Ancient Times

An original, playable ancient-world strategy **foundation**, built with React, Three.js, Express, and SQLite. This is not a static mockup, nor is it the entire large-scale game described in the design brief.

## Play, download, and deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for the live-preview controls, ZIP/local installation steps, GitHub branch instructions, and full-stack hosting setup. `render.yaml` provides an optional paid-service Blueprint with persistent SQLite storage; no hosted service is created automatically.

## Run

Requires **Node 22.13+** (tested with Node 22.22.3).

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The server binds to `0.0.0.0`, serves Vite and the API on the same origin, and supports the Arena live-preview host. No external database, API key, paid service, or frontend credential is required to play locally. Fonts are self-hosted through npm packages.

A real guest account and server-side session are created automatically so the game is immediately playable. Register from the status bar to copy that guest empire into a verified account. **Guest access depends on the browser’s session cookie**; signing out or losing it loses access to that guest empire. The quit dialog warns about this.

### Production

```sh
cp .env.example .env
# Set APP_URL to your public HTTPS URL and configure SMTP.
npm run build
npm start
```

Deploy behind an HTTPS reverse proxy and persist the `data/` directory. `.env` is loaded by Node, never bundled into the frontend. The application trusts **one reverse proxy**; adapt that setting to your actual infrastructure rather than trusting arbitrary forwarded headers. Secure cookies require HTTPS in production. SMTP must be configured for production registration and recovery; no development verification token is returned in production.

This version is a **single-server** application. Do not run multiple independent instances against the same player simulation. Use a dedicated simulation service and PostgreSQL when moving to a multi-server production architecture.

## Play

- **Pan:** drag empty terrain, or use WASD / arrow keys.
- **Zoom:** scroll, or use the map’s + / − buttons.
- **Rotate:** Q / E, middle-button drag, or the rotate button.
- **Select:** click a friendly cohort or its map badge. Shift-click adds cohorts; **Select all** selects the army.
- **Move / attack:** right-click terrain after selecting cohorts. On touch devices, choose **March**, then tap a destination. Cohorts automatically attack enemies in range.
- **Hold / retreat:** use the bottom command deck.
- **Build:** press B or select **Build**, choose a structure, then place it on valid ground near a friendly settlement. Construction has a server timer and resource cost.
- **Recruit:** press R or select **Recruit**. A cohort contains six soldiers and occupies six population slots.
- **Upgrade / repair:** select a completed building on the map and use its contextual controls.
- **Research:** open Research; prerequisites, costs, and completion times are enforced by the server.
- **Capture:** defeat an outpost’s defenders, then bring cohorts close enough to wear down its fortification. Ownership, income rewards, and victory statistics update automatically.
- **Diplomacy:** buy a 90-second truce from the status bar. A Market allows wood-to-gold trade through its contextual command.
- **Pause:** the top-right pause button stops the simulation. Dialogs alone do not pause the world.
- **Save:** Save progress or F5. Commands save immediately; active simulations also autosave every five seconds.
- **Main menu:** click the Dawn of Warriors emblem. Campaign and Story Mode are the two primary game modes.

The commander’s handbook provides ten persisted lessons. The opening objective panel points you toward building a farm, training a cohort, and capturing Riverwatch. Enemy raids start after a 150-second grace period. The capital must survive. Capturing every site and defeating remaining enemies wins the valley.

### Formation effects

| Formation | Effect                                                      |
| --------- | ----------------------------------------------------------- |
| Line      | +10% infantry attack                                        |
| Defensive | +40% defense, 30% slower movement                           |
| Spear     | +20% spearman attack                                        |
| Cavalry   | +30% mounted movement speed                                 |
| Archer    | +2 range for archers and crossbowmen                        |
| Siege     | Engineers inflict 145 rather than 110 damage per siege tick |

Cohorts visibly rearrange into formation. Spearmen counter cavalry; cavalry counters ranged soldiers. Defeated cohorts grant experience; every 100 XP gives the surviving cohort another level and +12% attack. Research adds faction-wide bonuses. Field Medicine heals near the capital.

## Implemented scope

- Responsive, original dark bronze/teal RTS interface; cinematic main menu; generated kingdom/commander artwork.
- Elevated interactive 3D valley: procedural terrain, forests, river, bridge, towns, army models, selection rings, unit health, projectiles, damage numbers, and shrink-out defeat effects.
- Real-time server-authoritative simulation, resource production/storage, timed recruitment/construction/research, combat, basic reactive enemy defenders, escalating raiding parties, capture rewards, victory and defeat.
- **18 buildable structures**, up to three building levels, and **14 research technologies**.
- **54 named roster entries**: 27 recruitable across three civilizations and 27 rival warriors across three opposing factions; nine role families with statistics, portraits, appearance metadata, recruitment requirements, and abilities/counters. Nine warriors are available to each chosen civilization.
- **Europe / Aurelian Republic**, **Asia / Shen Dynasty**, and **Middle East / Ashuran Dominion**, with architectural/environmental changes, roster changes, and real economic/combat bonuses. These currently use regional variants of **one valley layout**, not three large independent geographical maps.
- Africa and Australia appear in the atlas as **Coming soon** and cannot be started through the API.
- Sandbox Campaign plus an original **three-chapter Story Mode**, illustrated/panning prologues, dialogue, validated chapter objectives, sequential unlocks, and rewards.
- Player profile, live statistics, achievement collection, searchable roster, civilization lore, credits, persistent settings, generated ambient audio, and save-before-quit confirmation.
- Real authentication: registration, email verification, login, logout, logout all sessions, change password, password reset, and account deletion. Bcrypt hashes, opaque cookie sessions, hashed single-use tokens, login-attempt audit records, validation, origin checks, and rate limits.
- SQLite persistence for profiles, settings, game snapshots, accounts, sessions, verification/reset tokens, and security events.

### Explicitly not finished

This is the first expandable release, **not a claim that all 25 sections of the brief are complete**. Remaining work includes:

- Optional TOTP/2FA, backup codes, resend-verification/recovery support workflows, stronger anomaly detection, and production operations hardening.
- A large, streamed world with independent regional maps, exploration/fog-of-war, tactical terrain obstacles, full pathfinding, naval play, and multiple independent settlement economies.
- AI-managed building/resource economies, strategic alliances, adaptive army composition, and boss encounters. Current rivals defend, react, retreat, reinforce, raid, and scale modestly over time.
- Individual soldier selection; this build selects **cohorts**. It does not simulate every member as an independent selectable unit.
- Fifty bespoke hand-authored character models: the catalog has 54 distinct identities with procedural portraits/appearance data, but combat models are shared by role and enemy side, and regional statistics are intentionally related.
- Equipment inventories, active commander abilities, full character-level persistence independent of cohorts, deep age advancement, and civilization-specific technology trees. Research is currently a shared tree with faction bonuses.
- Full 3D cinematics, voice acting, long-form branching narrative, cinematic close-ups, sophisticated death animations, and more chapters. Current prologues are original illustrated cinematic presentations.
- Automated tutorial completion checks, fully translated UI, key remapping, and comprehensive accessibility/gamepad support.
- PostgreSQL schema normalization into all 20 requested domain tables, cloud backups, multiplayer, horizontal scaling, and conflict/version handling across simultaneous tabs.

The Extras → Credits panel and Account settings communicate the most important limitations inside the application as well.

## Local email verification and recovery

With no SMTP configuration, **development only**:

- Mail is written to `data/mailbox.jsonl` (ignored by Git).
- Registration displays a clearly labeled one-time development verification button.
- Password reset does **not** return recovery tokens to the client. Read the link from the local mailbox file. When using a proxied preview, open the `?reset=...` portion against your preview origin.

Production requires SMTP and delivers links using `APP_URL`. Tokens expire in 30 minutes and are stored hashed. Sessions last seven days and are invalidated on password reset/change. Preview cookies use Secure, SameSite=None, and Partitioned on `*.e2b.app`; ordinary same-site deployments use SameSite=Lax. Do not expose the development server or its mailbox to untrusted users.

## Architecture

```text
src/
  App.jsx                         game shell and view orchestration
  components/
    Battlefield.jsx               camera, input, map selection, visual effects
    EmpirePanels.jsx              building, recruitment, research, roster
    WorldPanels.jsx               atlas, story, profile, encyclopedia
    AccountPanels.jsx             authentication and settings
    UI.jsx                        reusable controls, dialogs, portraits, icons
  game/
    scene.js                      procedural geometry and mesh batching
    audio.js                      user-enabled procedural audio
  services/api.js                 same-origin API client
  styles/main.css                 responsive strategy interface
server/
  index.js                        API composition, validation, simulation loop
  auth.js                         account lifecycle and protected sessions
  db.js                           relational schema, constraints and save storage
  engine.js                       authoritative orders, economy, combat and AI
shared/catalog.js                 civilizations, buildings, characters, technology, story
 tests/
  engine.test.js                  deterministic simulation tests
  api.test.js                     isolated HTTP/auth tests (in-memory DB)
  browser.mjs                     real WebGL/browser interaction checks
```

Game data is serialized as a **server-generated, versioned snapshot** with stable entity identifiers. A client sends commands, never a trusted replacement snapshot, resource total, unlock list, or completed mission flag. This intentional foundation schema prioritizes consistent single-player saves over prematurely normalizing a large, changing RTS domain. Catalog definitions are shared for presentation; server definitions are authoritative.

Simulation runs at 1 Hz; rendering interpolates independently. Static terrain decorations and architecture are batched by material. Shadows and render resolution are reduced in lower graphics presets. Inactive worlds stop advancing 20 seconds after their last authenticated read; they are evicted from memory after three minutes, retaining the database save. There is no offline progression.

## API overview

| Route                                             | Purpose                                        |
| ------------------------------------------------- | ---------------------------------------------- |
| `POST /api/auth/guest`                            | Real temporary account/session                 |
| `POST /api/auth/register`                         | Validate and create an unverified account      |
| `POST /api/auth/verify`                           | Consume one-time email token                   |
| `POST /api/auth/login`                            | Authenticate and rotate session                |
| `GET /api/auth/me`                                | Current safe user identity                     |
| `POST /api/auth/forgot`, `/reset`, `/password`    | Recovery and password updates                  |
| `POST /api/auth/logout`, `/logout-all`, `/delete` | Session/account management                     |
| `GET /api/game`                                   | Load owner’s authoritative world               |
| `POST /api/game/new`                              | Start an allowed civilization/mode             |
| `POST /api/game/action`                           | Validated domain command                       |
| `POST /api/game/save`                             | Persist server state; ignores client snapshots |
| `GET /api/profile`                                | Derived player statistics and account activity |
| `GET /api/settings`, `PUT /api/settings`          | Validated persistent preferences               |

Available domain commands: `build`, `upgrade`, `repair`, `recruit`, `research`, `move`, `formation`, `hold`, `retreat`, `trade`, `diplomacy`, `claim`, `tutorial`, and `pause`. Cross-origin browser mutations are rejected. Owner identity comes only from the session. APIs use parameterized SQL and schema validation.

## Validation

```sh
npm test                 # deterministic engine + isolated API/security tests
npm run build            # production frontend build
npm audit --omit=dev     # dependency audit
npm run dev              # keep running in another terminal for the browser tests
npm run test:browser      # desktop/mobile WebGL and UI interaction checks
```

The browser test uses an npm-distributed headless Chromium for restricted Linux CI. Standard browser installations can be supplied using `CHROMIUM_PATH`. Set `BASE_URL` to test another running server. Screenshot/test artifacts are kept in ignored `.cache/`, never in the application source. Tests exercise actual placement, recruitment, movement, research, roster search, persistence, region selection, story startup, audio controls, and mobile navigation.

## Assets and licensing notes

The civilizations, narrative, UI, layouts, terrain, procedural geometry, and catalog are original to this implementation. The two kingdom/commander illustrations are AI-generated. Procedural portraits intentionally vary equipment, silhouette, and faction insignia within nine role families. Icons are Lucide (ISC); Cinzel and DM Sans are distributed under their package-provided Open Font Licenses. No proprietary assets, characters, maps, scenes, or dialogue from the inspiration games are included.
