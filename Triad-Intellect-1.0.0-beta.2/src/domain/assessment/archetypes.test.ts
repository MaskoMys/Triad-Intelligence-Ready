import { describe, expect, it } from "vitest";
import { ARCHETYPES, PROFILE_CODES, getArchetype, isProfileCode } from "./index";

describe("archetype catalogue", () => {
  it("contains a complete entry for every profile code", () => {
    expect(Object.keys(ARCHETYPES).sort()).toEqual([...PROFILE_CODES].sort());
    for (const code of PROFILE_CODES) {
      const archetype = getArchetype(code);
      expect(archetype.baseCode).toBe(code);
      expect(archetype.name.length).toBeGreaterThan(5);
      expect(archetype.strengths.length).toBeGreaterThanOrEqual(3);
      expect(archetype.challenges.length).toBeGreaterThanOrEqual(3);
      expect(archetype.careerPaths.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("validates profile codes", () => {
    expect(isProfileCode("CDL")).toBe(true);
    expect(isProfileCode("XYZ")).toBe(false);
  });
});
