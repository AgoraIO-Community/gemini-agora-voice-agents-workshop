'use client';

import { WorkshopPartners } from './WorkshopPartners';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelChoice, type DemoModel, type ThinkingLevel } from './ModelChoice';
import { ArchitectureChoice } from './ArchitectureChoice';
import type { Architecture } from '@/lib/demo';

type QuickstartPreCallCardProps = {
  isLoading: boolean;
  error: string | null;
  onStartConversation: () => void;
  architecture: Architecture;
  onArchitectureChange: (architecture: Architecture) => void;
  model: DemoModel;
  onModelChange: (model: DemoModel) => void;
  thinkingLevel: ThinkingLevel;
  onThinkingLevelChange: (level: ThinkingLevel) => void;
};

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
  architecture,
  onArchitectureChange,
  model,
  onModelChange,
  thinkingLevel,
  onThinkingLevelChange,
}: QuickstartPreCallCardProps) {
  return (
    <div className="demo-precall m-auto flex w-[min(92vw,42rem)] animate-fade-up flex-col items-center px-8 py-7 text-center">
      <WorkshopPartners />
      <p className="demo-label mb-3 mt-6 text-muted-foreground">Voice agents / Live playground</p>
      <h1 className="text-foreground">One app. Two ways to talk.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Meet Ada. Compare the cascaded pipeline with Gemini Live, then start a conversation.
      </p>

      <ArchitectureChoice architecture={architecture} onArchitectureChange={onArchitectureChange} disabled={isLoading} />

      {architecture === 'mllm' && (
        <ModelChoice model={model} onModelChange={onModelChange} thinkingLevel={thinkingLevel} onThinkingLevelChange={onThinkingLevelChange} disabled={isLoading} />
      )}

      <Button
        onClick={onStartConversation}
        disabled={isLoading}
        className="mt-6 h-11 w-full rounded-md border border-primary bg-primary text-sm font-semibold text-primary-foreground hover:border-foreground hover:bg-primary disabled:opacity-60"
        aria-label={
          isLoading
            ? 'Starting conversation with AI agent'
            : 'Start conversation with AI agent'
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting...
          </>
        ) : (
          'Start Conversation'
        )}
      </Button>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}
