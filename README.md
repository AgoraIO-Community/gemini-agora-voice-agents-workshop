# Agora Voice AI Workshop - V2 presentation

This is a static-first, Vercel-ready presentation website. The host and audience share one canonical HTML deck; a small browser bundle adds Agora Signaling, and one serverless function mints short-lived RTM tokens.

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

Participants open the root URL. The audience automatically derives the local calendar date, such as `2026-08-12`, and connects to the RTM message channel with that exact name.

The presenter opens `/host`, enters the workshop password, and then connects as the trusted host for the same channel. Presenter controls remain covered until authentication succeeds.

If two workshops share a date or device dates disagree, override the channel in both URLs:

```text
Audience: /?channel=sf-rehearsal
Host:     /host?channel=sf-rehearsal
```

Overrides are normalized to lowercase URL-safe names; spaces become hyphens. Names must start with a letter or number, contain only letters, numbers, `_`, and `-`, and be no longer than 48 characters. An invalid override is never allowed to silently fall back to the date channel.

- Arrow keys, Space, Page Up, and Page Down move through slides.
- `H` opens host controls from any slide.
- `N` opens the notes for the current slide.
- `F` toggles full screen.
- `T` toggles light and dark themes.
- `?` shows all shortcuts.
- The city bubble displays only the current city and switches when clicked.

## Audience view

Participants normally use `/`, or `/?channel=...` when the host supplies an override. Their browser resolves the channel, reuses a browser-scoped string UID from local storage, subscribes with messages and presence, and requests the current snapshot. The server validates the audience-only UID format and mints every reload or renewal token for that exact subject. Before the first trusted host snapshot arrives, a dedicated waiting screen explains that the session has not started without exposing signaling details. The deck appears automatically when the authenticated host connects. `/audience` remains as a compatibility alias.

- Host controls, presenter notes, timing cues, and their keyboard shortcuts are unavailable.
- Slides, links, copy/download actions, and visual content come from the same `index.html` used by the host.
- Every slide has a stable `data-slide-id`; URLs such as `#slide-install-cli` keep working if slides are reordered.
- While following, host-controlled navigation is locked but links, copy buttons, and downloads remain usable.
- **Following host** switches to independent browsing; **Return to live** applies the newest host snapshot.
- Late arrivals request the current snapshot, and host presence events provide an additional recovery path.
- After the first trusted host snapshot, the audience browser saves a safe local copy of the workshop choices. On a later visit with no active host, the waiting screen still shows the inactive session and offers **View presentation** for the last workshop.

The presentation exposes a transport-neutral API at `window.workshopPresentation`. `src/signaling.js` publishes host snapshots from `workshop:statechange` and dispatches validated remote snapshots to the audience view. Email-claim snapshots contain only the claim mode and event name. Manual mode shares the host-entered phone and SIP fields, including the password, with the live audience; those operational values are never added to saved audience decks.

The saved audience copy records the channel, venue, template, code track, its derived project tooling, model-provider selections, theme, and terminal environment. It does not retain SIP settings, campaign data, credentials, or secrets. Audience fragments such as `#slide-install-cli` are cleared while waiting or following the host. Opening the saved copy starts at the welcome slide, enables slide fragments and independent navigation, and continues checking for a live session.

## Verification

```sh
npm run verify
agora project feature status rtm
```

The tests mock the Agora SDK boundary and cover local-date session validation, RTM login-before-subscribe, message and presence subscription, trusted-host filtering, late joins, login failure, token renewal, cleanup order, token subject identity, environment password overrides, and the committed fallback password.

The selected `Testing` project currently reports token enforcement as disabled in Agora Console. The app still uses server-generated tokens and never exposes the App Certificate, but token enforcement must be enabled on the project before treating a public deployment as authenticated.

Host choices are stored only in that browser:

- Venue Wi-Fi name and session-only password for the projected opening slide
- San Francisco or New York
- One Agent Studio template for the room
- Python, Next.js, or Go
- Track-derived tooling: Bun for Python, pnpm for TypeScript, or Make for Go
- Light, dark, or system theme

Python and Bun are the defaults.

## Required configuration before publishing

### Discord invite QR

The included `discord-qr.svg` is an obvious placeholder. Create the global live-events invite, copy `workshop-config.example.json` to a local configuration file, insert the real HTTPS invite, and generate the replacement:

```sh
python3 scripts/generate-discord-qr.py workshop-config.json discord-qr.svg
```

This requires the Python `reportlab` package. Scan the generated QR from a second device before publishing.

### Workshop phone-number claims

Slide 14 supports two host-selected setup methods:

- **Email claim API**: enter the allocator’s event name, such as `SFWRKSHP26`, in host controls. The optional host claim email lets the presenter claim directly without the overlay; it stays in session storage and is not signaled. Each attendee still enters their own email so they receive their unique phone number and SIP details.
- **Manual details**: enter a phone number plus the SIP vendor, display name, server, transport, username, and password in host controls. These values are shared over the trusted live signaling session.

Configure the allocator token only on the server:

```sh
PHONE_CLAIM_API_URL=https://carrot-seven.vercel.app/api/event-number-claims
PHONE_CLAIM_API_TOKEN=replace-with-the-allocator-token
```

The browser posts only `{ email, eventName }` to `/api/phone-number-claim`; the server adds authorization and returns an allowlisted response. FQDN connections use `sip_subdomain` as the trunk address and show that username/password credentials are not required. Attendee emails and returned SIP assignments remain in memory for the current tab only. Neither setup method’s operational values are retained in the audience’s saved workshop copy. Test the flow from a participant device before doors open, limit the allocator to the event pool, and disable claims before revoking the pool and trunk credentials after the event.

## Deployment

Import this directory as a new Vercel project or run the Vercel CLI from this directory. `vercel.json` supplies the static-site settings and basic response headers.

The attendee projects use different optional finish paths:

- Next.js: Vercel
- Python: Render
- Go: Render
- Any local track: Cloudflare Quick Tunnel for a short-lived preview

Local execution remains the required workshop finish line.

The provider links in the deck currently open the provider's deployment entry point. After each track passes rehearsal, replace them with repository-specific one-click deployment URLs for the verified workshop starter.

## Clean-machine rehearsal

Rehearse the selected Studio template, code track, derived tooling, and venue network end to end. Python uses Bun, TypeScript uses pnpm, and Go uses Make.

1. Confirm the Studio template labels and dynamic-variable behavior.
2. Upload a one-row CSV with `phone_number` first and E.164 data.
3. Configure the claim event name (or manual SIP details) in host controls, claim one temporary number from a participant device, launch a campaign, and verify the full shutdown and revocation procedure.
4. Run `agora quickstart list` and confirm `python`, `nextjs`, and `go` remain current template IDs.
5. Run the selected quickstart from a clean machine.
6. For Go, verify whether the explicit environment-write step is still required.
7. Run `npx skills add agoraio/skills` from the workshop root, choose project/workspace scope if prompted, and confirm the presenter's coding agent loads the Agora Skill.
8. Generate `website-sdr` with the distributed prompt.
9. Verify AI Noise Suppression entitlement, Wasm asset serving, browser support, and graceful fallback.
10. Test the selected durable deploy button and the Cloudflare tunnel against the generated app.
11. Run `agora project doctor --deep` before doors open.
12. Scan the Discord QR from iOS and Android.

## First-party command references

- [Voice Agent quickstart](https://docs.agora.io/en/ai/get-started/quickstart)
- [Agora CLI](https://github.com/AgoraIO/cli)
- [Python quickstart](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-python)
- [Next.js quickstart](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs)
- [Go quickstart](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-go)
- [Integrate with Agora Skills](https://docs.agora.io/en/ai/get-started/skills-integrate)
- [Prompt template variables](https://docs.agora.io/en/ai/studio/build/prompt-design#template-variables)
- [Campaign contact-list format](https://docs.agora.io/en/ai/studio/deploy/campaign#contact-list-format)
- [Start and stop an agent](https://docs.agora.io/en/ai/build/start-stop-agent)
- [Managed mode](https://docs.agora.io/en/ai/build/custom-model-integration/managed-mode)
- [Web AI Noise Suppression](https://docs.agora.io/en/realtime-media/voice/build/enhance-the-audio-experience/ai-noise-suppression/web)
# Agents-Get-Started-Workshop
