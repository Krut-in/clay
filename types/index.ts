// ─── Card Types ───
export type CardVariant = 'original' | 'compressed' | 'expanded' | 'rephrased';

export interface Card {
  id: string;
  text: string;
  topic: string | null;
  variant: CardVariant;
  loading: boolean;
  inspect: string | null;
}

// ─── Blueprint Types ───
export interface BlueprintTopic {
  text: string;
  selected: boolean;
}

export interface BlueprintData {
  interpretation: string;
  topics: BlueprintTopic[];
}

// ─── Evaluator Types ───
export type EvalStrength = 'strong' | 'moderate' | 'weak';

export interface CardEvaluation {
  id: string;
  strength: EvalStrength;
  suggestion: string;
  overlaps_with: string | null;  // card ID of the overlapping card, or null
}

export interface EvaluatorResults {
  cards: CardEvaluation[];
  overall: string;
  recommended_action: string;
}

// ─── App Status ───
export type AppStatus = {
  type: 'idle' | 'blueprinting' | 'loading' | 'streaming' | 'ready' | 'card-loading' | 'evaluating' | 'error';
  message?: string;
};
