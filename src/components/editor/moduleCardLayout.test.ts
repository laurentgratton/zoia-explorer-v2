import { layoutModuleCards } from './moduleCardLayout';

describe('module card visibility', () => {
  it('packs around a tall card using measured sizes, without hiding shorter cards', () => {
    const cards = Array.from({ length: 34 }, (_, i) => ({
      id: String(i), width: 240, height: i === 0 ? 2100 : 180 + (i % 4) * 90,
    }));
    const positions = layoutModuleCards(cards);
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = positions[cards[i].id], b = positions[cards[j].id];
        expect(a.x + cards[i].width <= b.x || b.x + cards[j].width <= a.x ||
          a.y + cards[i].height <= b.y || b.y + cards[j].height <= a.y).toBe(true);
      }
    }
    // Short cards should use the space alongside the keyboard, not all follow its bottom.
    expect(positions['6'].y).toBeLessThan(2100);
    expect(positions['6'].x).not.toBe(positions['0'].x);
    expect(new Set(Object.values(positions).map(p => p.x)).size).toBeGreaterThan(3);
  });

  it('separates saved overlapping cards after expansion, preserving unrelated placements', () => {
    const cards = [
      { id: 'tall', width: 240, height: 600, position: { x: 40, y: 60 } },
      { id: 'covered', width: 240, height: 200, position: { x: 40, y: 420 } },
      { id: 'separate', width: 240, height: 200, position: { x: -400, y: -120 } },
    ];
    const positions = layoutModuleCards(cards);
    expect(positions.tall).toEqual(cards[0].position);
    expect(positions.covered.x).toBe(40);
    expect(positions.covered.y).toBeGreaterThanOrEqual(660);
    expect(positions.separate).toEqual(cards[2].position);
    expect(layoutModuleCards(cards.map(c => ({ ...c, position: positions[c.id] })))).toEqual(positions);
  });
});
