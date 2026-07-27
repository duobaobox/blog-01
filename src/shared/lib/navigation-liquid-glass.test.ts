import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNavigationGlassMap,
  resolveNavigationCondensedState,
} from "./navigation-liquid-glass";

test("navigation condensed state uses separate enter and release thresholds", () => {
  assert.equal(resolveNavigationCondensedState(false, 64), false);
  assert.equal(resolveNavigationCondensedState(false, 65), true);
  assert.equal(resolveNavigationCondensedState(true, 24), true);
  assert.equal(resolveNavigationCondensedState(true, 23), false);
  assert.equal(resolveNavigationCondensedState(true, 48), true);
  assert.equal(resolveNavigationCondensedState(false, 48), false);
});

test("navigation glass map follows the live pill dimensions", () => {
  const uri = buildNavigationGlassMap(960.4, 42.4);
  const svg = decodeURIComponent(uri.replace("data:image/svg+xml,", ""));

  assert.match(svg, /viewBox="0 0 960 42"/);
  assert.match(svg, /rx="21"/);
  assert.match(svg, /mix-blend-mode:difference/);
  assert.match(svg, /hsl\(0 0% 50% \/ 5%\)/);
  assert.match(svg, /filter:blur\(10px\)/);
});

test("navigation glass map clamps invalid dimensions", () => {
  const uri = buildNavigationGlassMap(0, -10);
  const svg = decodeURIComponent(uri.replace("data:image/svg+xml,", ""));

  assert.match(svg, /viewBox="0 0 1 1"/);
  assert.doesNotMatch(svg, /width="-/);
  assert.doesNotMatch(svg, /height="-/);
});
