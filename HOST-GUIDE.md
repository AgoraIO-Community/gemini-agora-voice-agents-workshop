# Host guide

## Run of show

Thursday, September 17 · 9–10 am PDT (12–1 pm EDT) · Agora Discord stage. Recorded. A podcast taping with the same speakers follows the live hour.

The stream opens with a short welcome and the Google DeepMind segment on Gemini 3.5 Transcribe (about 15 minutes total). **This deck starts when Google hands back.** Times below are from that handoff.

| Min | Segment | Slides | Owner |
| --- | --- | --- | --- |
| 0–1 | Thank Google, framing, slide-follow link | `welcome`, `run-of-show` | Agora |
| 1–3 | Agora foundation: platform, cascaded loop, native loop, side-by-side code, pick an architecture | `what-is-agora` → `two-architectures` | Agora |
| 3–6 | Recipes as quickstarts: CLI, `agora init --recipe`, run steps | `install-cli` → `run-recipe` | Agora |
| 6–10 | Live demo: cascaded, then Gemini Live | `live-demo` | Agora |
| 10–46 | Discussion (full-duplex primary, Flash for cascaded backup), then Q&A from chat for the last 8 minutes | `community-discussion` | Both |
| 46–48 | Close: recording, recipes, podcast, event channel | `close` | Agora host |

## Before the stream

- Both demo apps running from pre-initialized copies: `gemini-voice-agent` (cascaded) and `gemini-live-agent` (Gemini Live). Fallback recordings ready for each.
- `agora upgrade` done on the presenter machine; `agora login` already completed so it is mentioned, not run.
- Press `H`: select **Architecture · A · Cascaded** and **Code track · TypeScript**. The pipeline slide maps directly to the cascaded TypeScript code.
- Post the slide-follow link and both repository links in the event channel.
- Confirm the Gemini model names with the Google speaker so the deck matches their segment; the deck labels the ASR stage "Gemini 3.5 Transcribe Live" and the LLM "Gemini 3.6 Flash".
- Have the deck open on `welcome` before the Google segment ends.

## Host controls

Participants open the root URL. The presenter opens `/host` and enters the default password `AgoraWorkshop2026`. Both views use the local date as the RTM channel, for example `2026-09-17`; add `?channel=gemini-rehearsal` to both URLs for rehearsals.

Press `H` from any slide to change:

- Architecture — also selectable by clicking a card on the two-architectures slide or the toggle on the init slide
- Code track — TypeScript, Python, or Go
- Theme and terminal label

Architecture and track sync to the audience view. Press `N` for the current slide’s notes.

## During the Agora segment

1. `compare-code`: the two loops in code. Left is three vendors, right is one `GeminiLive`. Everything else is identical.
2. `two-architectures`: pick cascaded; optionally run `agora recipes list` live to show the catalog. Mention `primaryPrompt` in one sentence for the coding-agent crowd.
3. `install-cli`: one slide; install and login are already done on the presenter machine.
4. `init-recipe`: type the cascaded init command live. Do not wait for it to finish; the demo apps are already running.
5. `run-recipe`: step through the four commands (enter, install, Google key, run). Init already wrote the Agora credentials. Never show the environment file.
6. `live-demo`: cascaded first — one question to Ada, point at the transcript and latency panel. Then Gemini Live — same question, switch to extended thinking, show the slider.

## Hard boundaries

- No Gemini Live demo without Agora in the loop.
- Never show or paste a Google API key or Agora App Certificate on stream.
- Roadmap questions that need a long answer go to the event channel or the podcast, not the live Q&A.

## Recovery

- Live call fails: play the recorded happy path for that demo and continue.
- CLI blocked: skip to `compare-code`; the recipe commands are in the audience view for viewers to copy later.
- Google segment runs over: skip `install-cli` and the backup discussion topic.
- Discussion runs short: bring multimodal realtime (screen + voice) forward from the channel topics.
