import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { check } from '../src/index';

const testDir = fileURLToPath(new URL('.', import.meta.url));

const passFixtures = [
    { name: 'simple', entry: 'pass/simple/index.js' },
    { name: 'external-imports', entry: 'pass/external-imports/index.js' },
    { name: 'class', entry: 'pass/class/index.js' },
    { name: 'reexport', entry: 'pass/reexport/index.js' },
];

const failFixtures = [
    { name: 'side-effect', entry: 'fail/side-effect/index.js' },
    { name: 'transitive', entry: 'fail/transitive/index.js' },
];

describe('check', () => {
    describe('should pass (tree-shakeable)', () => {
        for (const { name, entry } of passFixtures) {
            it(name, async () => {
                const result = await check(resolve(testDir, entry));
                expect(result.isShaken).toBe(true);
            });
        }
    });

    describe('should fail (not tree-shakeable)', () => {
        for (const { name, entry } of failFixtures) {
            it(name, async () => {
                const result = await check(resolve(testDir, entry));
                expect(result.isShaken).toBe(false);
            });
        }
    });
});
