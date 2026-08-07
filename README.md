# Agora Voice AI Workshop - V2 presentation

This is a static, Vercel-ready presentation website. The workshop runs from `index.html`; no application build is required.

## Presenting

Open `index.html` through a local web server or the deployed Vercel URL.

- Arrow keys, Space, Page Up, and Page Down move through slides.
- `H` opens host controls from any slide.
- `N` opens the notes for the current slide.
- `F` toggles full screen.
- `T` toggles light and dark themes.
- `?` shows all shortcuts.
- The city bubble displays only the current city and switches when clicked.

Host choices are stored only in that browser:

- San Francisco or New York
- One Agent Studio template for the room
- Python, Next.js, or Go
- pnpm or Bun for the Skills-generated web project
- Light, dark, or system theme

Python and Bun are the defaults.

## Required configuration before publishing

### Discord invite QR

The included `discord-qr.svg` is an obvious placeholder. Create the global live-events invite, copy `workshop-config.example.json` to a local configuration file, insert the real HTTPS invite, and generate the replacement:

```sh
python3 scripts/generate-discord-qr.py workshop-config.json discord-qr.svg
```

This requires the Python `reportlab` package. Scan the generated QR from a second device before publishing.

### Workshop phone-number cards

Each attendee card contains only one temporary phone number. Configure the shared event SIP server, username, and password in the presentation's host controls; do not add those shared credentials to the card JSON. The project ignores the entire `private/` directory.

1. Copy `private.example/sip-numbers.example.json` to `private/sip-numbers.json`.
2. Replace the examples with the temporary workshop phone numbers.
3. Generate the print file for plain white paper:

```sh
python3 scripts/generate-sip-cards.py private/sip-numbers.json private/sip-cards.pdf --cut-guides
```

For pre-perforated 3.5 x 2 inch business-card stock, omit `--cut-guides`.

The sample PDF uses fake phone numbers and demonstrates the exact ten-card US Letter layout. Plan for 50 real numbers per workshop, distribute cards at check-in, and revoke the number pool and shared trunk credentials after the event.

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

Rehearse the selected Studio template, code track, package manager, and venue network end to end.

1. Confirm the Studio template labels and dynamic-variable behavior.
2. Upload a one-row CSV with `phone_number` first and E.164 data.
3. Configure the shared event SIP trunk in the host controls, test one temporary number, launch a campaign, and verify the full revocation procedure.
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
