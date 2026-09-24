import assert from "node:assert/strict";
import test from "node:test";
import { applyShuffle, createShuffle, isValidShuffle, shuffle } from "./shuffle.mjs";

const cards = [
  { id: "one", options: ["a", "b", "c", "d"], correctIndex: 2 },
  { id: "two", options: ["e", "f", "g", "h"], correctIndex: 0 },
];

test("shuffle changes a copy and preserves every item", () => {
  const input = [0, 1, 2, 3];
  assert.deepEqual(shuffle(input, () => 0), [1, 2, 3, 0]);
  assert.deepEqual(input, [0, 1, 2, 3]);
});

test("card and option shuffling keeps the correct answer aligned", () => {
  const selection = createShuffle(cards, () => 0);
  assert.equal(isValidShuffle(cards, selection), true);
  const result = applyShuffle(cards, selection);
  assert.deepEqual(result.map((card) => card.id), ["two", "one"]);
  for (const card of result) {
    const original = cards.find((entry) => entry.id === card.id);
    assert.equal(card.options[card.correctIndex], original.options[original.correctIndex]);
  }
  assert.deepEqual(cards[0].options, ["a", "b", "c", "d"]);
});

test("invalid or outdated stored permutations are rejected", () => {
  const selection = createShuffle(cards);
  assert.equal(isValidShuffle([...cards, { id: "new", options: ["x", "y"], correctIndex: 0 }], selection), false);
  assert.equal(isValidShuffle(cards, { ...selection, options: { ...selection.options, one: [0, 0, 1, 2] } }), false);
});
