/** Fisher–Yates: return a new shuffled array without changing the source. */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createShuffle(cards, random = Math.random) {
  return {
    order: shuffle(cards.map((card) => card.id), random),
    options: Object.fromEntries(cards.map((card) => [
      card.id, shuffle(card.options.map((_, index) => index), random),
    ])),
  };
}

export function isValidShuffle(cards, saved) {
  if (!saved || !Array.isArray(saved.order) || saved.order.length !== cards.length) return false;
  const byId = new Map(cards.map((card) => [card.id, card]));
  if (new Set(saved.order).size !== cards.length || saved.order.some((id) => !byId.has(id))) return false;
  return cards.every((card) => {
    const optionOrder = saved.options?.[card.id];
    return Array.isArray(optionOrder) && optionOrder.length === card.options.length &&
      new Set(optionOrder).size === card.options.length &&
      optionOrder.every((index) => Number.isInteger(index) && index >= 0 && index < card.options.length);
  });
}

export function applyShuffle(cards, selection) {
  const byId = new Map(cards.map((card) => [card.id, card]));
  return selection.order.map((id) => {
    const card = byId.get(id);
    const optionOrder = selection.options[id];
    return {
      ...card,
      options: optionOrder.map((index) => card.options[index]),
      correctIndex: optionOrder.indexOf(card.correctIndex),
    };
  });
}
