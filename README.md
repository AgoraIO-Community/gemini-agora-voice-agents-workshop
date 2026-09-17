# Agora × Gemini Discord Livestream — presentation

This is the presentation website and live demo for the *Build Voice Agents with Gemini + Agora* livestream, packaged as one Next.js app:

- **The deck** (`public/index.html`) is a static page the host and audience share. A small browser bundle adds Agora Signaling so Discord viewers follow the slides in sync; `/api/rtm-token` mints their short-lived RTM tokens.
- **The demo** (`/demo`) is one voice-agent UI with an architecture switch: **A · Cascaded** (Gemini ASR → Gemini 3.6 Flash → TTS) or **B · Gemini Live** (native multimodal, with the extended-thinking model and thinking-level slider). `/api/invite-agent` builds whichever agent is asked for; the UI and API are merged from the two official recipes, `gemini-agora-voice-agents-nextjs` and `agora-gemini-mllm-nextjs`.

## Local setup

The repository is bound to the existing Agora `Testing` project in `.agora/project.json`. Use Agora CLI to refresh the ignored local environment, then install and run:

```sh
agora project use Testing
agora project env write .env.local --project Testing --template standard
pnpm install
pnpm dev
```

`.env.example` lists every variable. The deck needs the Agora App ID and Certificate; the demo also needs `NEXT_GOOGLE_API_KEY`. Both the `AGORA_*` names the CLI writes and the `NEXT_*` names from the recipes are accepted.

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

## Live demo

The live-demo slide behaves differently per view:

- **Host:** the slide embeds `/demo?embed=1` in a frame that follows the architecture selected in the **H** panel. Switching architecture reloads the frame. Nothing loads until the slide is shown, and the frame unloads when the host moves on.
- **Audience:** the slide shows a self-service card with the public `/demo` link. Nothing starts on a viewer's device until they open it, so they can come back to that slide after the Q&A and try both architectures themselves.

Every demo session runs an agent on the Agora project's credentials with a 30-second idle timeout and a one-hour cap. Open `/demo` directly on any device to try it outside the deck.

## Verification

```sh
pnpm verify
agora project feature status rtm
```

The tests mock the Agora SDK boundary and cover local-date session validation, RTM login-before-subscribe, message and presence subscription, trusted-host filtering, late joins, token renewal, the archived audience snapshot, the deck structure (slide order, recipe slugs, shared-state keys, syntax highlighting, the host/audience split on the demo slide), and the demo's request validation.

The selected `Testing` project currently reports token enforcement as disabled in Agora Console. Enable it before treating a public deployment as authenticated.

## Required configuration before publishing

Create the Discord event invite, copy `workshop-config.example.json` to a local configuration file, insert the real HTTPS invite, and generate the replacement QR:

```sh
python3 scripts/generate-discord-qr.py workshop-config.json discord-qr.svg
```

The run slide has no separate Agora env step: `agora init --recipe` writes the Agora credentials for all six Gemini recipes. If you clone manually instead, run `agora quickstart env write .` (Next.js) or `agora project env write server/.env.local` (Python/Go) before adding the Google key.

Update the slide-follow short link on the welcome slide (`EVENT.joinLabel` and the `front-join-link` href in `public/index.html`).

## Deployment

The repository is linked to the Vercel project `agora-gdxe/gemini-agora-voice-agents-workshop`; pushes to `main` deploy automatically. Set `NEXT_PUBLIC_AGORA_APP_ID`, `NEXT_AGORA_APP_CERTIFICATE`, `NEXT_GOOGLE_API_KEY`, and `WORKSHOP_HOST_KEY` in the project's environment.

## Rehearsal

1. Run `agora upgrade` and confirm `agora recipes list` shows all six Gemini voice recipes.
2. Run `agora init gemini-voice-agent --recipe gemini-agora-voice-agents-nextjs` on a clean machine and confirm it writes `.env.local` with the Agora values (verified 2026-09-16 against the live catalog).
3. Open `/host`, go to the live-demo slide, and run one conversation per architecture from the embedded demo. Record a three-minute happy-path fallback for each.
4. Confirm the Gemini model names on the pipeline slide match the Google DeepMind segment that precedes this deck.
5. Route the demo audio into the Discord stage and check levels with headphones on.
6. Scan the Discord QR from iOS and Android.

## First-party command references

- [Agora CLI](https://github.com/AgoraIO/cli)
- [Agora recipes](https://recipes.agora.io)
- [Voice Agent quickstart](https://docs.agora.io/en/ai/get-started/quickstart)
- [Start and stop an agent](https://docs.agora.io/en/ai/build/start-stop-agent)
