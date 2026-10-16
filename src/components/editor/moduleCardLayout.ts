type Position = { x: number; y: number };
type Card = { id: string; width: number; height: number; position?: Position; role?: 'source' | 'processor' | 'output' };

// Use the shortest available column for new cards. Keep saved positions unless
// a card grows into another one; move only the obstructed cards down to clear it.
export function layoutModuleCards(cards: Card[]): Record<string, Position> {
  const columns = Math.max(3, Math.ceil(Math.sqrt(cards.length)));
  const hasSources = cards.some(card => card.role === 'source');
  const hasOutputs = cards.some(card => card.role === 'output');
  const placed: (Card & { position: Position })[] = [];
  const positions: Record<string, Position> = {};
  const gap = 80;
  for (const card of cards) {
    const availableColumns = card.role === 'source' ? [0]
      : card.role === 'output' ? [columns - 1]
      : Array.from({ length: columns }, (_, column) => column).filter(column =>
        (!hasSources || column > 0) && (!hasOutputs || column < columns - 1)
      );
    const candidates = availableColumns.map(column => {
      const x = 40 + column * 400;
      const y = Math.max(60, ...placed.filter(other =>
        x < other.position.x + other.width + gap && x + card.width + gap > other.position.x
      ).map(other => other.position.y + other.height + gap));
      return { x, y };
    });
    let position = { ...(card.position ?? candidates.reduce((a, b) => a.y <= b.y ? a : b)) };
    for (;;) {
      const collisions = placed.filter(other =>
        position.x < other.position.x + other.width + gap && position.x + card.width + gap > other.position.x &&
        position.y < other.position.y + other.height + gap && position.y + card.height + gap > other.position.y
      );
      if (!collisions.length) break;
      position = { x: position.x, y: Math.max(...collisions.map(other => other.position.y + other.height + gap)) };
    }
    positions[card.id] = position;
    placed.push({ ...card, position });
  }
  return positions;
}
