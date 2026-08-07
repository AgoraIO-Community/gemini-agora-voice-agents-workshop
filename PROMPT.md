Use the Agora Skills installed in this workspace to create a new project named `website-sdr`.

Build a beginner-friendly website SDR Voice AI agent. Use Python for the Agora agent service and a simple browser client for the local website experience.

Product requirements:

- A polished local website with a clear control for starting and ending a voice conversation.
- An inbound-style SDR agent that collects the visitor's name, company, role, Voice AI use case, and desired next step.
- The agent should qualify the opportunity, summarize what it learned, and help move the visitor toward an Agora Voice AI consultation.
- Simulate the final lead-submission or appointment action through the system prompt. Be transparent that this workshop version does not persist or transmit the lead.
- Integrate Agora AI Noise Suppression on the browser microphone track using Agora's documented `agora-extension-ai-denoiser` extension. Serve its required Wasm assets correctly, check entitlement and browser compatibility, and fall back gracefully when unsupported. Do not treat noise suppression as a system-prompt instruction.
- Use Agora managed keys for the default model path, and document where BYOK can be configured later.
- Keep secrets server-side and provide a safe `.env.example`.
- Include clear local setup and run instructions using pnpm for web dependencies.
- Add an optional quick-deploy path for Render, but treat local execution as the required finish line.

Acceptance criteria:

1. The project is created under `./website-sdr` without modifying `./agent-quickstart`.
2. The local website loads and can start a live voice conversation with the SDR.
3. The agent gathers the required lead details and performs the transparent simulated submission.
4. Agora AI Noise Suppression is enabled.
5. The project includes verified install, run, and optional deployment instructions.

Use the installed Agora Skills and current official Agora documentation. Explain the important files when you finish.
