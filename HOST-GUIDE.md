# Host guide

## Suggested in-person run of show

This is a 90-minute hands-on workshop. Adjust the relative times to the event; no date or venue is embedded. Open the welcome slide before doors and keep the join link and QR visible for late arrivals.

| Minutes | Segment | Checkpoint |
| --- | --- | --- |
| 0–8 | Welcome, agenda, room setup | Audience view joined, accounts ready, headphones on |
| 8–20 | Agora and the two Gemini architectures | Attendees understand both paths and their shared session lifecycle |
| 20–35 | CLI login and Gemini recipe discovery | Each attendee identifies their recipe slug and runtime prerequisites |
| 35–55 | Initialize and run the recipe | An untouched local app starts a real voice conversation |
| 55–70 | Add Gemini Live with Agora Skills | One project with both architectures and a safe pre-call switch |
| 70–75 | Compare the combined demo | Recognize the same UI and start/stop flow for both paths |
| 75–88 | Local testing, build clinic, Questions during the build | Test a real conversation, interruption, stop, and restart in both modes |
| 88–90 | Close | Stop active sessions and servers; share catalog and community |

## Before attendees arrive

- Rehearse the [Gemini recipe catalog](https://recipes.agora.io/?q=gemini#recipes), the exact CLI commands, and a fresh TypeScript cascaded initialization. TypeScript is the default; Python and Go remain supported.
- Prepare your Agora and Google accounts, a working recipe checkout, the embedded demo, terminal, editor, and coding assistant. Keep environment files and credentials off the projector.
- Confirm Node.js 22+ and pnpm for TypeScript, Python 3.10+ and Bun for Python, or Go 1.23+, pnpm, and Make for Go. Each recipe README is the source of truth.
- Have a short fallback recording for both architectures. Check projector audio and headphones.
- The presenter displays `bit.ly/4fDSxTQ`; the QR encodes the full Gemini workshop URL directly. Configure `joinUrl` and `qrUrl` in `workshop-join.json` (or `WORKSHOP_JOIN_URL` / `WORKSHOP_QR_URL`), rebuild, and scan the generated QR. The join card appears on presenter slides only, with a larger welcome treatment. Rehearsals with `?channel=...` use that same channel in the join QR.
- Assign a helper to account/CLI setup and another to code/Skills questions when possible. Press **H**, expand **Venue Wi-Fi**, and enter the network name and password for the projected presenter footer. Both start empty. The network is saved on this device; the password is saved only in this tab’s session. Neither is broadcast or archived. Clear the fields or use **Reset defaults** after the event.

## Host and audience controls

Participants open the root workshop URL. The presenter opens `/host` and enters the workshop password. Both views derive the local date as the live channel; for rehearsals or concurrent events, use the same explicit channel in both URLs, for example `/host?channel=gemini-rehearsal` and `/?channel=gemini-rehearsal`.

Press **H** to choose the architecture, presenter code track, theme, and terminal label. Press **N** for speaker notes. Notes use Show, Say, Checkpoint, and Return handoffs for the key desktop demonstrations. Press **T** for relative timing cues.

Audience members select TypeScript, Python, or Go in their own view. TypeScript is the initial default. Their browser remembers the choice locally across slides and reloads; a presenter track change does not replace it. The host still controls the shared architecture and slide. **Following host** lets attendees browse independently; **Return to live** catches up. Late arrivals receive the current slide after the trusted host connects.

## Phone companion

From **H**, open or copy the phone-notes link. On your phone, open `/host-notes`, enter the same channel and host password, and select **Open notes**. Keep slide controls on the computer; the phone is a read-only view of the current notes, relative timing, and next slide.

Pause audience sharing on the computer and advance a slide during rehearsal: phone notes must continue following. Switch to another phone app and back; the companion reconnects and requests the latest notes. Use **Reconnect** if needed. A full page reload asks for the password again. The page marks its notes stale if the host leaves or the connection drops.

## Desktop demonstration handoffs

| Slide | Show and say | Checkpoint and return |
| --- | --- | --- |
| `room-setup` | Agora Console, Google AI Studio, recipe prerequisites | Accounts and headphones ready; return to Agora introduction |
| `install-cli` | Official installation docs, then `agora login` | Authenticated terminal; return to cascaded initialization |
| `init-recipe` | Initialize the cascaded recipe in the attendee’s language | One project created; return to run steps |
| `run-recipe` | Enter folder, install, configure Google key privately, run | Cascaded conversation succeeds; commit the working baseline |
| `customize-recipe` | In the same project: install Skills and copy the language-specific combined-app prompt | Gemini Live added alongside Cascaded; one UI, channel, transcript, and lifecycle |
| `live-demo` | Compare cascaded and native in the combined reference demo | Return to testing both paths in the attendee’s app |
| `test-your-agent` | Test the same question, interruption, stop, and restart in both modes | No cascaded regression; switching stops the old agent; one active session |

## Recipe details and boundaries

- Use individual attendee Agora projects and Google keys. Gemini recipe stages use the server-side Google API key; do not suggest Agora-managed keys replace it.
- The current cascaded recipes use GeminiSTT → Gemini 3.6 Flash → Gemini 3.8 Flash TTS preview. Native recipes use Gemini Live. The condensed code comparison omits application setup; use linked source files for full implementation.
- `recipes list` and `recipes show` are read-only. `init --recipe` creates a project from the selected recipe. The selected language determines the matching Gemini recipe, whose README determines runtime and commands.
- Save a Git commit of the working cascaded baseline, then extend the same project with Agora Skills and the matching native recipe. Do not initialize a second app. Keep one voice UI, Agora channel, transcript, and start/stop lifecycle. Validate architecture server-side and retain the matching session for cleanup. Adapt a use case only after both paths work.
- Local voice conversations in both modes are required; tunnels and deployment are optional. Test in two waves if the room is noisy.
- Never leave a conversation running while switching architectures, closing the workshop, or packing up.

## Recovery

- CLI blocked: use `agora doctor`, check login, project access, recipe slug, and runtime prerequisites. Have a helper work with the attendee while the room continues.
- Recipe blocked: consult its README and environment example. Check that the Google key can access the chosen Gemini model; do not display the key.
- Live demo fails: open `/demo` in a new tab or play the prepared fallback, then continue the local build.
- Skills blocked: check the workspace and selected installation scope, then refresh the coding-assistant session.
- Late arrival: point to the persistent join QR and language selector. Pair them with a helper for accounts and initialization.
- Time slipping: protect the working baseline, both architecture tests, and build-clinic time. Skip optional deployment and extra demo variations.

## Projector layout

Use `/host` on the projector. The presenter footer groups the join QR, Bitly link, and venue Wi-Fi; it remains visible on every presenter slide, with a larger QR and link on the welcome slide. The audience view intentionally hides joining details. Slide 4 uses the video as the background with readable overlays. Rehearse at the projector’s native resolution (the layout is checked at 1024×768 and 1280×720). Questions and troubleshooting happen during the build-along; there is no separate build-together slide.
