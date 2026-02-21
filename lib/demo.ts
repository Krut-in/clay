import type { Card, EvaluatorResults } from '@/types';

export const DEMO_QUERY = 'Why do people struggle with chat interfaces, and how can AI be improved?';

export const DEMO_INTERPRETATION = 'The user wants to understand the fundamental friction points in conversational AI interfaces and explore concrete improvements.';

export const DEMO_CARDS: Card[] = [
  {
    id: 'demo-1',
    text: 'The blank text box is the original sin of chat interfaces. It forces users to fully articulate their need before seeing anything — a cognitively expensive task that most people either over-specify with paragraph-long prompts or under-specify with two vague words. The interface demands the answer before showing what questions it can even handle.',
    topic: 'The blank box problem',
    variant: 'original',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-2',
    text: 'AI models optimise for completeness when users want relevance — the only fix is to re-prompt entirely, breaking flow.',
    topic: 'Verbosity and relevance mismatch',
    variant: 'compressed',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-3',
    text: 'Once Claude responds, its output is presented as a finished product. The conversation architecture frames the response as complete — there are no handles, no affordances, no visual signals that say "this is raw material you should reshape." The user becomes a passive reader at the exact moment they should be an active collaborator.',
    topic: 'Output as finished product',
    variant: 'original',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-4',
    text: 'The prompting skill gap creates a two-tier system. Consider a product manager who needs a competitive analysis — they know exactly what they want, but translating that into a prompt that produces the right format, depth, and focus requires a separate skill entirely. They came for a report. They got a lesson in prompt engineering. The interface should bridge this gap by offering structural controls (like topic selection and card manipulation) instead of demanding linguistic precision.',
    topic: 'Prompting skill gap',
    variant: 'expanded',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-5',
    text: 'Chat treats every exchange like a phone call — sequential, temporal, and disposable. But human cognition is spatial. We remember where things were, not when they were said. A conversation from twenty minutes ago is functionally lost in scroll, like trying to find a specific page by flipping through a book with your eyes closed.',
    topic: 'Spatial memory vs linear scroll',
    variant: 'rephrased',
    loading: false,
    inspect: null,
  },
];

export const DEMO_EVALUATOR: EvaluatorResults = {
  cards: [
    {
      id: 'demo-1',
      strength: 'strong',
      suggestion: 'Clear and well-argued. The blank box metaphor is compelling. Keep as-is.',
      overlaps_with: null,
    },
    {
      id: 'demo-2',
      strength: 'strong',
      suggestion: 'Already compressed. Concise and punchy — good demonstration of the compress action.',
      overlaps_with: null,
    },
    {
      id: 'demo-3',
      strength: 'weak',
      suggestion: 'This point is vague and lacks a concrete example — try expanding it with a specific scenario.',
      overlaps_with: null,
    },
    {
      id: 'demo-4',
      strength: 'strong',
      suggestion: 'Great concrete example with the product manager. This is the strongest card in the set.',
      overlaps_with: null,
    },
    {
      id: 'demo-5',
      strength: 'moderate',
      suggestion: 'The spatial metaphor overlaps with the blank box argument in card 1 — consider dismissing one.',
      overlaps_with: 'demo-1',
    },
  ],
  overall: '3 strong points, 1 moderate, 1 weak. Cards 1 and 5 have thematic overlap — consider dismissing one. Card 3 needs expansion.',
  recommended_action: 'Expand card 3 to strengthen the weakest argument with a concrete example.',
};
