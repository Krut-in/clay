'use client';

import { CopilotPopup } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

export function CommandPalette() {
  return (
    <CopilotPopup
      instructions={`You are CLAY's command interpreter. You control a canvas of idea cards.

Available actions:
- compressCard(cardId): Compress a card to one punchy sentence
- expandCard(cardId): Expand a card to 3-5 sentences with a concrete example
- rephraseCard(cardId): Rephrase from a completely different angle
- inspectCard(cardId): Toggle the reasoning/assumptions panel on a card
- dismissCards(cardIds): Remove one or more cards from the canvas
- highlightOverlaps(): Pulse overlap indicators for 2 seconds

You have access to all card data including text, topics, variants, and evaluator assessments (strength, suggestions, overlaps).

When the user says "remove weak cards" or "dismiss weak ones", find cards where evaluator strength is "weak" and call dismissCards with those IDs.
When the user says "compress the longest card", find the card with the most text and call compressCard.
When the user references a card by number or topic, resolve it to the correct card ID.

Execute the most appropriate action. Be decisive — don't ask for clarification unless truly ambiguous.`}
      labels={{
        title: 'CLAY Command',
        initial: 'What would you like to do with your cards?',
        placeholder: 'e.g. "remove all weak cards" or "compress the longest card"',
      }}
      className="clay-copilot-popup"
    />
  );
}
