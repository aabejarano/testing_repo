import { test as base } from 'playwright-bdd';

// World holds mutable state shared across all steps within a single scenario.
// This allows a Given step to set up context that a later When step can consume.
export type World = {
  expectedDomain: string;
};

export const test = base.extend<{ world: World }>({
  world: async ({}, use) => {
    await use({ expectedDomain: '' });
  },
});
