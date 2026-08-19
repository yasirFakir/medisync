import assert from 'node:assert';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

export async function describe(suiteName: string, fn: () => void | Promise<void>) {
  console.log(`\n📦 \x1b[1m\x1b[34m[TEST SUITE]\x1b[0m ${suiteName}`);
  await fn();
}

export async function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${name}`);
    console.error(`    \x1b[31m${err?.message || err}\x1b[0m`);
    if (err?.stack) {
      console.error(`    ${err.stack.split('\n').slice(1, 4).join('\n    ')}`);
    }
  }
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      assert.strictEqual(actual, expected, `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    },
    toEqual(expected: any) {
      assert.deepStrictEqual(actual, expected, `Expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`);
    },
    toBeGreaterThan(expected: number) {
      assert.ok(actual > expected, `Expected ${actual} > ${expected}`);
    },
    toBeLessThan(expected: number) {
      assert.ok(actual < expected, `Expected ${actual} < ${expected}`);
    },
    toBeGreaterThanOrEqual(expected: number) {
      assert.ok(actual >= expected, `Expected ${actual} >= ${expected}`);
    },
    toBeNull() {
      assert.strictEqual(actual, null, `Expected ${JSON.stringify(actual)} to be null`);
    },
    toBeDefined() {
      assert.notStrictEqual(actual, undefined, `Expected value to be defined`);
    },
    toBeUndefined() {
      assert.strictEqual(actual, undefined, `Expected value to be undefined`);
    },
    toBeTruthy() {
      assert.ok(!!actual, `Expected truthy value, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      assert.ok(!actual, `Expected falsy value, got ${JSON.stringify(actual)}`);
    },
    toContain(expected: any) {
      if (typeof actual === 'string') {
        assert.ok(actual.includes(expected), `Expected "${actual}" to contain "${expected}"`);
      } else if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected), `Expected array to contain ${JSON.stringify(expected)}`);
      } else {
        throw new Error(`toContain called on unsupported type: ${typeof actual}`);
      }
    },
    toThrow(expectedMessage?: string | RegExp) {
      assert.throws(() => {
        if (typeof actual === 'function') actual();
      }, (err: any) => {
        if (!expectedMessage) return true;
        if (typeof expectedMessage === 'string') {
          return err.message.includes(expectedMessage);
        }
        return expectedMessage.test(err.message);
      });
    }
  };
}

export function getSummary() {
  return { totalTests, passedTests, failedTests };
}
