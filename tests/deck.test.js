import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const slideIds = [...html.matchAll(/<section class="slide[^"]*" data-slide-id="([^"]+)"/g)].map((m) => m[1]);

describe("livestream deck structure", () => {
  it("follows the Agora segment: welcome, foundation, CLI recipes, demo, Q&A, close", () => {
    expect(slideIds).toEqual([
      "welcome", "run-of-show",
      "what-is-agora", "conversational-ai-pipeline", "mllm-pipeline", "compare-code", "two-architectures",
      "install-cli", "init-recipe", "run-recipe",
      "live-demo",
      "qa", "close"
    ]);
  });

  it("opens with an agenda that ends on Q&A and matches the slide order", () => {
    const slide = html.slice(html.indexOf('data-slide-id="run-of-show"'), html.indexOf('data-slide-id="what-is-agora"'));
    const steps = [...slide.matchAll(/<li class="agenda-item[^"]*">.*?<strong>(.*?)<\/strong>/g)].map((m) => m[1]);
    expect(steps).toEqual(["About Agora", "Voice &amp; Conversational AI architectures", "Using Gemini with Agora Conversational AI", "Live demos", "Q&amp;A"]);
    expect(slide).toContain('class="agenda-item qa"');
    expect(slide).not.toMatch(/podcast/i);
  });

  it("labels the cascade with the Gemini stages and a generic TTS", () => {
    expect(html).toContain("Gemini 3.5 Transcribe Live");
    expect(html).toContain("Gemini 3.6 Flash");
    expect(html).toContain("Voice synthesis");
    expect(html).toContain("Synthesized audio stream");
    expect(html).toContain("Agora SD-RTN®");
    expect(html).not.toMatch(/MiniMax(?!TTS)/);
  });

  it("shows the native loop with SD-RTN underneath and timed in/out paths", () => {
    expect(html).toContain('data-slide-id="mllm-pipeline"');
    expect(html).toContain('class="native-loop"');
    expect(html).toContain('class="loop-band"');
    expect(html).toContain('class="loop-lane"');
    expect(html).toContain('class="loop-seg h"');
    expect((html.match(/class="loop-dot (in|out)"/g) || []).length).toBe(6);
    expect(html).toContain("AUDIO → AUDIO");
    expect(html).toContain("animation: loop-out-left var(--loop-cycle)");
  });

  it("publishes every Gemini recipe slug for both architectures and all three tracks", () => {
    for (const slug of [
      "gemini-agora-voice-agents-nextjs", "gemini-agora-voice-agents-python", "gemini-agora-voice-agents-go",
      "agora-gemini-mllm-nextjs", "agora-gemini-mllm-python", "agora-gemini-mllm-go"
    ]) {
      expect(html).toContain(`slug: "${slug}"`);
    }
    expect(html).toContain('"agora init " + ARCHITECTURES[architecture].dir + " --recipe "');
  });

  it("links every recipe to its recipes.agora.io page and offers a GitHub button", () => {
    expect(html).toContain('var RECIPE_SITE = "https://recipes.agora.io/recipes/"');
    for (const link of ["recipe", "github"]) {
      expect(html).toContain(`data-recipe-link="${link}"`);
    }
    expect(html).toContain('href="https://recipes.agora.io/recipes/agora-gemini-mllm-nextjs"');
    expect((html.match(/class="github-button"/g) || []).length).toBeGreaterThanOrEqual(1);
  });

  it("shares architecture and track with the audience but never a credential", () => {
    const sharedKeys = html.slice(html.indexOf("var SHARED_CONFIG_KEYS"), html.indexOf("var SHARED_CONFIG_ENUMS"));
    expect(sharedKeys).toContain('"architecture"');
    expect(sharedKeys).toContain('"track"');
    expect(sharedKeys).not.toMatch(/apiKey|googleKey|secret|certificate|password/i);
    expect(html).not.toContain("PHONE_CLAIM");
    expect(html).not.toContain("sipClaimDialog");
  });

  it("only touches DOM ids that exist in the markup", () => {
    const script = html.slice(html.indexOf("<script>"), html.indexOf("</script>"));
    const referenced = new Set([...script.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]));
    const defined = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const scope of ["quickstart"]) { referenced.add(`${scope}Command`); referenced.add(`${scope}CommandLabel`); }
    expect([...referenced].filter((id) => !defined.has(id))).toEqual([]);
  });

  it("embeds the demo for the host only and gives the audience a self-service link", () => {
    const slide = html.slice(html.indexOf('data-slide-id="live-demo"'), html.indexOf('data-slide-id="qa"'));
    expect(slide).toMatch(/<div class="demo-embed" data-host-only>\s*<iframe id="demoFrame"[^>]*allow="microphone; autoplay"/);
    expect(slide).not.toMatch(/<iframe[^>]*\ssrc=/);
    expect(slide).toMatch(/<div class="demo-invite" data-audience-only>/);
    expect(slide).toContain('data-demo-link target="_blank"');
    expect(html).toContain("body.view-host [data-audience-only] { display: none !important; }");
    expect(html).toContain('demoUrl({ architecture: state.architecture, embed: true })');
    expect(html).toContain('if (!demoFrame || isAudience) return;');
  });

  it("renders both agent implementations side by side", () => {
    expect(html).toContain('id="cascadedCode"');
    expect(html).toContain('id="mllmCode"');
    expect(html).toContain('renderAgentCode("cascadedCode", cascaded, TRACKS[state.track].language)');
    expect(html).toContain('renderAgentCode("mllmCode", mllm, TRACKS[state.track].language)');
  });

  describe("syntax highlighting", () => {
    // Evaluate the tokenizer straight out of the page so the test covers the shipped code.
    const start = html.indexOf("      var CODE_LANGUAGES = {");
    const end = html.indexOf("      function renderAgentCode(");
    const tokenize = new Function(html.slice(start, end) + "\nreturn tokenizeCodeLine;")();
    const types = (line, language) => tokenize(line, language).filter((t) => t.type).map((t) => `${t.type}:${t.text}`);

    it("defines a colour for every token class the tokenizer emits", () => {
      for (const cls of ["comment", "string", "number", "keyword", "type", "fn", "key", "punct"]) {
        expect(html).toMatch(new RegExp(`\\.code-${cls} \\{ color: #[0-9a-f]{6}`));
      }
    });

    it("tokenizes TypeScript: keywords, types, calls, object keys, strings", () => {
      expect(types("const agent = new Agent({", "typescript")).toEqual([
        "keyword:const", "punct:=", "keyword:new", "type:Agent", "punct:({"
      ]);
      expect(types("  apiKey: googleApiKey, model: 'gemini-3.6-flash', // note", "typescript")).toEqual([
        "key:apiKey", "punct::", "punct:,", "key:model", "punct::", "string:'gemini-3.6-flash'", "punct:,", "comment:// note"
      ]);
      expect(types("advancedFeatures: { enable_rtm: true },", "typescript")).toContain("number:true");
      expect(types("const agentId = await session.start();", "typescript")).toContain("fn:start");
    });

    it("tokenizes Python: kwargs as keys, literals, hash comments, no // comments", () => {
      expect(types('llm = Gemini(api_key=key, model="gemini-3.6-flash")  # llm', "python")).toEqual([
        "key:llm", "punct:=", "type:Gemini", "punct:(", "key:api_key", "punct:=", "punct:,", "key:model", "punct:=",
        'string:"gemini-3.6-flash"', "punct:)", "comment:# llm"
      ]);
      expect(types("from agora_agent.agentkit import Agent as AgoraAgent", "python")).toEqual([
        "keyword:from", "punct:.", "keyword:import", "type:Agent", "keyword:as", "type:AgoraAgent"
      ]);
      expect(types("x = a // b", "python")).not.toContainEqual(expect.stringMatching(/^comment:/));
      expect(types("transcribe_agent=True,", "python")).toContain("number:True");
    });

    it("tokenizes Go: struct fields as keys, := is not a key, constructors as types, nil literal", () => {
      expect(types("agent := agentkit.NewAgent(", "go")).toEqual([
        "punct::=", "punct:.", "type:NewAgent", "punct:("
      ]);
      expect(types('    APIKey: s.googleAPIKey, Model: "gemini-3.6-flash",', "go")).toEqual([
        "key:APIKey", "punct::", "punct:.", "punct:,", "key:Model", "punct::", 'string:"gemini-3.6-flash"', "punct:,"
      ]);
      expect(types("TranscribeAgent: boolPtr(true),", "go")).toEqual([
        "key:TranscribeAgent", "punct::", "fn:boolPtr", "punct:(", "number:true", "punct:),"
      ]);
      expect(types("if err != nil {", "go")).toContain("number:nil");
    });

    it("round-trips every line of every recipe snippet without losing characters", () => {
      const script = html.slice(html.indexOf("var RECIPES = {"), html.indexOf("var RECIPE_SITE"));
      const snippets = [...script.matchAll(/code: ("(?:[^"\\]|\\.)*")/g)].map((m) => JSON.parse(m[1]));
      expect(snippets).toHaveLength(6);
      for (const language of ["typescript", "python", "go"]) {
        for (const snippet of snippets) {
          for (const line of snippet.split("\n")) {
            expect(tokenize(line, language).map((t) => t.text).join("")).toBe(line);
          }
        }
      }
    });
  });
});
