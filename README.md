# Agora × Gemini — in-person workshop

This is the presentation website and live demo for the *Build Voice Agents with Gemini + Agora* in-person workshop, packaged as one Next.js app:

- **The deck** (`public/index.html`) is a static page the host and audience share. A small browser bundle adds Agora Signaling so attendees follow the slides in sync; `/api/rtm-token` mints their short-lived RTM tokens.
- **The demo** (`/demo`) is one voice-agent UI with an architecture switch: **A · Cascaded** (Gemini ASR → Gemini 3.6 Flash → Gemini TTS preview) or **B · Gemini Live** (native multimodal, with the extended-thinking model and thinking-level slider). `/api/invite-agent` builds whichever agent is asked for; the UI and API are merged from the two official recipes, `gemini-agora-voice-agents-nextjs` and `agora-gemini-mllm-nextjs`.

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

- **Architecture** — `A · Cascaded` (Gemini ASR → Gemini 3.6 Flash → Gemini TTS preview) or `B · Native` (Gemini 3.8 Live end to end). The two-architectures slide also selects this when a card is clicked.
- **Code track** — TypeScript (default), Python, or Go.
- Light, dark, or system theme.

Architecture and track drive the `agora init --recipe` command, the run steps, the side-by-side code comparison, and the live-demo slide. Every command and code snippet comes from the recipe repositories:

| | Cascaded | Native (MLLM) |
| --- | --- | --- |
| TypeScript | `gemini-agora-voice-agents-nextjs` | `agora-gemini-mllm-nextjs` |
| Python | `gemini-agora-voice-agents-python` | `agora-gemini-mllm-python` |
| Go | `gemini-agora-voice-agents-go` | `agora-gemini-mllm-go` |

The recipe data lives in the `RECIPES` object in `public/index.html`. Update it there if a recipe README changes its setup or run commands.

## Audience view

Viewers use `/`, or `/?channel=...` when the host supplies an override. Before the first trusted host snapshot arrives, a waiting screen explains that the session has not started. The deck appears automatically when the authenticated host connects. `/audience` remains as a compatibility alias.

- Host controls, presenter notes, timing cues, and their shortcuts are unavailable.
- The audience language selector defaults to TypeScript and offers Python and Go. It stores the choice locally, applies it to recipe commands and code, and keeps it through slide changes, host snapshots, and reloads. It does not change the presenter’s language.
- Slides, links, and copy actions come from the same `index.html` used by the host.
- Every slide has a stable `data-slide-id`; URLs such as `#slide-compare-code` keep working if slides are reordered.
- **Following host** switches to independent browsing; **Return to live** applies the newest host snapshot.
- After the first host snapshot, the browser saves a safe local copy of the architecture, track, theme, and terminal choices so the deck can be reopened later with no host present. No credentials are ever included.

## Phone presenter notes

Open `/host-notes` on your phone and enter the same workshop channel and host password. The **H** panel includes a phone-notes link and copy button for the current channel. This is the same read-only companion as the studio workshop: it shows the current slide’s notes, timing, next slide, and the desktop-demo instructions written in those notes; slide control stays on the presenter’s computer.

Notes keep following when audience sharing is paused. Returning from another phone app reconnects and requests the current slide; **Reconnect** retries manually. The phone uses its own notes identity so it does not replace the desktop host’s connection. Its password stays in memory and must be entered again after reloading the page.

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

## Workshop join link and QR

The presenter header shows `bit.ly/4fDSxTQ` and a QR code on every slide. Neither appears in the audience view. `workshop-join.json` configures `joinUrl` for the clickable short link and `qrUrl` for the full audience URL encoded in the QR (`https://gemini-agora-voice-agents-workshop.vercel.app/`). Build-time overrides are `WORKSHOP_JOIN_URL` and `WORKSHOP_QR_URL`. Rebuild to generate `public/workshop-join-qr.svg` for printing or sharing. Rehearsal channel overrides use the direct audience URL with the matching channel for both destinations.

The run slide has no separate Agora env step: `agora init --recipe` writes the Agora credentials. When cloning manually, follow the selected recipe README’s environment setup instead. Add the Google key to `.env.local` for TypeScript or `server/.env.local` for Python/Go, and keep it server-side.

## In-person flow

The deck adapts the setup checkpoints, CLI recipe discovery, Skills customization, and build clinic from `1_studio-agents-cli-workshop`. It keeps the Gemini workshop’s cascaded/native comparison and embedded demo. See [HOST-GUIDE.md](HOST-GUIDE.md) for a suggested 90-minute run of show and presenter handoffs. The schedule is relative; no venue or event date is assumed.

Start at the [Gemini catalog](https://recipes.agora.io/?q=gemini#recipes), inspect the selected recipe with `agora recipes show <slug>`, initialize it, and get an untouched local conversation working. Then install Agora Skills in a separate project copy and adapt one use case. Local voice success is the finish line; deployment is optional.

Recipe setup commands and condensed agent excerpts were checked against all six official repository READMEs and agent sources on November 17, 2026. The cascaded recipes now use Gemini TTS preview (`gemini-3.8-flash-tts`) with the same server-side Google API key. The linked repositories contain complete runnable implementations; slide excerpts omit app plumbing and helpers.

## Deployment

The repository is linked to the Vercel project `agora-gdxe/gemini-agora-voice-agents-workshop`; pushes to `main` deploy automatically. Set `NEXT_PUBLIC_AGORA_APP_ID`, `NEXT_AGORA_APP_CERTIFICATE`, `NEXT_GOOGLE_API_KEY`, and `WORKSHOP_HOST_KEY` in the project's environment.

## Rehearsal

1. Run `agora upgrade`; open the Gemini catalog and confirm the six recipe slugs and prerequisites.
2. Initialize the TypeScript cascaded recipe in a clean folder and test setup, Google-key configuration, and a local conversation. Rehearse Python and Go commands when supporting those tracks.
3. Open `/host` and an audience browser on the same channel. Choose Python or Go in the audience view, advance slides, change the host track, and reload; the attendee’s language must stay selected.
4. Scan the join QR from the welcome, code, demo, and closing slides. Verify the new short link reaches this workshop’s audience view. Test a late join while the presenter is already on a later slide.
5. Run both embedded demo architectures with headphones. Prepare a short fallback recording, account setup help, and separate CLI/build support owners.
6. Rehearse the Skills install and one custom conversation. Test the projector layout and mobile audience view; protect time for the build clinic.

## First-party command references

- [Agora CLI](https://github.com/AgoraIO/cli)
- [Gemini recipes](https://recipes.agora.io/?q=gemini#recipes)
- [Voice Agent quickstart](https://docs.agora.io/en/ai/get-started/quickstart)
- [Start and stop an agent](https://docs.agora.io/en/ai/build/start-stop-agent)

## Preserved online version

The pre-workshop online deck is preserved at commit `4b7489b` on [`archive/online-workshop-2026-11-17`](https://github.com/AgoraIO-Community/gemini-agora-voice-agents-workshop/tree/archive/online-workshop-2026-11-17). The in-person version stays on `main` and deploys to the existing Gemini workshop Vercel project. The separate studio workshop is unchanged.
