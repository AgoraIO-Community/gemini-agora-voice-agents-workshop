# Host guide

## Event timing

| Time | Segment | Required outcome |
| --- | --- | --- |
| 5:30 | Doors and setup | Wi-Fi connected, accounts verified, headphones ready, phone-number cards distributed |
| 5:45-5:50 | Welcome | Set the one/two/three build promise |
| 5:50-6:00 | Agora foundation | Attendees understand SDRTN, Channels, configuration, start/stop, and webhooks |
| 6:00-6:45 | Agent Studio | One selected template, dynamic variables, Contacts CSV, temporary SIP number, one-recipient campaign, live call |
| 6:45-7:18 | Agora CLI and agent structure | Untouched quickstart runs; attendees recognize the Agent SDK, definition, lifecycle, managed keys, and BYOK |
| 7:18-7:45 | Agora Skills | Project-local Skills install; `website-sdr` is generated, installed, run, and tested by voice |
| 7:45-8:15 | Build clinic | Individualized Studio, CLI, and Skills support; optional tunnel/deploy |
| 8:15-8:20 | Close | Discord badge, sample repository, community, next monthly workshop |
| 8:30-9:00 | Cleanup | Revoke number pool, stop tunnels and demos, clear venue |

## Host configuration

Press `H` from any slide and select:

- Event city
- One Studio template for the whole room
- Python, Next.js, or Go
- pnpm or Bun for the Skills-generated project
- Presentation theme (cycle System, Light, and Dark with the icon button)
- One shared event SIP provider, server, transport protocol, username, and password

The server and username remain saved on this device. The SIP password remains only for the current browser tab. On slide 12, reveal it only after everyone is ready to enter the shared trunk, then hide it before continuing.

Press `N` for the current slide's speaker notes.

## Staffing

### San Francisco

- Hosts: Hermes and Mason
- Support: Bien, Yi, and possibly K2

### New York

- Host: Hermes
- Support: Bryce and Aleksey

During hands-on sections, assign separate Studio and code/Skills support owners. Questions are welcome throughout; stage instruction should continue while support resolves individual blockers.

## Hard boundaries

- Use individual attendee Agora projects.
- Use managed keys for hands-on work; demonstrate BYOK without revealing a secret.
- Keep the first CLI quickstart untouched.
- Skills create `website-sdr` as a separate sibling project.
- The attendee SDR simulates lead submission through its system prompt; it does not persist or transmit lead data.
- A presenter may demonstrate a separately hosted real MCP or custom-LLM integration.
- Local voice success is required. Tunnel and cloud deployments are optional.
- AI Noise Suppression is a client audio integration, not a system-prompt instruction. Keep headphones as the dependable room recommendation.
- Never commit or deploy SIP connection details. Project the shared password only during the guided entry step, and do not allow it to be photographed.
- Revoke every temporary number and the shared trunk credentials after the event.

## Recovery

- Studio blocked: use the presenter's prepared account to demonstrate the remaining call path.
- Quickstart blocked: run `agora project doctor --deep`; keep the room moving while a code-support owner helps.
- Skills blocked: confirm the command ran at `agora_agents_workshop`, project/workspace scope was selected, and the coding-agent session was refreshed.
- Room too noisy: switch from simultaneous testing to two waves and require headphones.
- Tunnel blocked: skip it. Local voice success is already the finish line.
- Time slipping: protect the Studio phone call, untouched CLI quickstart, code-structure walkthrough, and one working website SDR.
