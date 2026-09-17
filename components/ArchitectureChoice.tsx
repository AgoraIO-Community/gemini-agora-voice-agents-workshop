'use client';

import { ARCHITECTURES, ARCHITECTURE_IDS, type Architecture } from '@/lib/demo';

// Mirrors the two-architectures slide: A · Cascaded or B · Gemini Live.
export function ArchitectureChoice({ architecture, onArchitectureChange, disabled = false }: {
  architecture: Architecture;
  onArchitectureChange: (architecture: Architecture) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 w-full text-left">
      <span className="text-sm font-medium text-white">Choose how the agent is built</span>
      <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Agent architecture">
        {ARCHITECTURE_IDS.map((id) => {
          const choice = ARCHITECTURES[id];
          const active = architecture === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onArchitectureChange(id)}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors disabled:opacity-60 ${
                active ? 'border-primary bg-primary/15 text-white' : 'border-[#444] text-muted-foreground hover:border-white'
              }`}
            >
              <span className="block text-xs font-semibold uppercase tracking-wide text-primary">{choice.letter} · {choice.label}</span>
              <span className="mt-1 block text-xs leading-5">{choice.title}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{ARCHITECTURES[architecture].blurb}</p>
    </div>
  );
}
