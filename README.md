# Agora × Gemini Discord Livestream — presentation

This is a static-first, Vercel-ready presentation website for the *Build Voice Agents with Gemini + Agora* livestream. The host and audience share one canonical HTML deck; a small browser bundle adds Agora Signaling so Discord viewers can follow the slides in sync, and one serverless function mints short-lived RTM tokens.

## Local setup

The repository is bound to the existing Agora `Testing` project in `.agora/project.json`. Use Agora CLI to refresh the ignored local environment, then install and run:

```sh
agora project use Testing
agora project env write .env.local --project Testing --template standard
npm install
npm run dev
```

The host route requires the password `AgoraWorkshop2026` by default. `WORKSHOP_HOST_KEY` can override that committed development password in the deployment environment. The accepted password stays in the presenter’s browser tab and is never placed in the URL.

## Presenting

Viewers open the root URL. The audience automatically derives the local calendar date, such as `2026-09-17`, and connects to the RTM message channel with that exact name.

The presenter opens `/host`, enters the password, and connects as the trusted host for the same channel. Presenter controls remain covered until authentication succeeds.

If two sessions share a date or device dates disagree, override the channel in both URLs:

```text
Audience: /?channel=gemini-rehearsal
Host:     /host?channel=gemini-rehearsal
```

Overrides are normalized to lowercase URL-safe names; spaces become hyphens. Names must start with a letter or number, contain only letters, numbers, `_`, and `-`, and be no longer than 48 characters.

- Arrow keys, Space, Page Up, and Page Down move through slides.
- `H` opens host controls from any slide.
- `N` opens the notes for the current slide.
- `F` toggles full screen.
- `T` toggles the timing cues.
- `O` switches the terminal label between Mac, Linux, and PC.
- `?` shows all shortcuts.

## Host choices

Press `H` and select:

- **Architecture** — `A · Cascaded` (Gemini ASR → Gemini 3.6 Flash → Agora-managed TTS) or `B · Native` (Gemini 3.8 Live end to end). The two-architectures slide also selects this when a card is clicked.
- **Code track** — TypeScript (default), Python, or Go.
- Light, dark, or system theme.

Architecture and track drive the `agora init --recipe` command, the run steps, the side-by-side code comparison, and the live-demo slide. Every command and code snippet comes from the recipe repositories:

| | Cascaded | Native (MLLM) |
| --- | --- | --- |
| TypeScript | `gemini-agora-voice-agents-nextjs` | `agora-gemini-mllm-nextjs` |
| Python | `gemini-agora-voice-agents-python` | `agora-gemini-mllm-python` |
| Go | `gemini-agora-voice-agents-go` | `agora-gemini-mllm-go` |

The recipe data lives in the `RECIPES` object in `index.html`. Update it there if a recipe README changes its setup or run commands.

## Audience view

Viewers use `/`, or `/?channel=...` when the host supplies an override. Before the first trusted host snapshot arrives, a waiting screen explains that the session has not started. The deck appears automatically when the authenticated host connects. `/audience` remains as a compatibility alias.

- Host controls, presenter notes, timing cues, and their shortcuts are unavailable.
- Slides, links, and copy actions come from the same `index.html` used by the host.
- Every slide has a stable `data-slide-id`; URLs such as `#slide-compare-code` keep working if slides are reordered.
- **Following host** switches to independent browsing; **Return to live** applies the newest host snapshot.
- After the first host snapshot, the browser saves a safe local copy of the architecture, track, theme, and terminal choices so the deck can be reopened later with no host present. No credentials are ever included.

## Verification

```sh
npm run verify
agora project feature status rtm
```

The tests mock the Agora SDK boundary and cover local-date session validation, RTM login-before-subscribe, message and presence subscription, trusted-host filtering, late joins, token renewal, the archived audience snapshot, and the deck structure (slide order, recipe slugs, shared-state keys).

The selected `Testing` project currently reports token enforcement as disabled in Agora Console. Enable it before treating a public deployment as authenticated.

## Required configuration before publishing

Create the Discord event invite, copy `workshop-config.example.json` to a local configuration file, insert the real HTTPS invite, and generate the replacement QR:

```sh
python3 scripts/generate-discord-qr.py workshop-config.json discord-qr.svg
```

The run slide has no separate Agora env step: `agora init --recipe` writes the Agora credentials for all six Gemini recipes. If you clone manually instead, run `agora quickstart env write .` (Next.js) or `agora project env write server/.env.local` (Python/Go) before adding the Google key.

Update the slide-follow short link on the welcome slide (`EVENT.joinLabel` and the `front-join-link` href in `index.html`).

## Deployment

Import this directory as a new Vercel project or run the Vercel CLI from this directory. `vercel.json` supplies the static-site settings and basic response headers.

## Rehearsal

1. Run `agora upgrade` and confirm `agora recipes list` shows all six Gemini voice recipes.
2. Run `agora init gemini-voice-agent --recipe gemini-agora-voice-agents-nextjs` on a clean machine and confirm it writes `.env.local` with the Agora values (verified 2026-09-16 against the live catalog).
3. Start both demo apps (`gemini-voice-agent` and `gemini-live-agent`) before the stream and record a three-minute happy-path fallback for each.
4. Confirm the Gemini model names on the pipeline slide match the Google DeepMind segment that precedes this deck.
5. Route the demo audio into the Discord stage and check levels with headphones on.
6. Scan the Discord QR from iOS and Android.

## First-party command references

- [Agora CLI](https://github.com/AgoraIO/cli)
- [Agora recipes](https://recipes.agora.io)
- [Voice Agent quickstart](https://docs.agora.io/en/ai/get-started/quickstart)
- [Start and stop an agent](https://docs.agora.io/en/ai/build/start-stop-agent)
