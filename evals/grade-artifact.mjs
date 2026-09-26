import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [grader, workspace, fixture] = process.argv.slice(2);
const checks = [];
const check = async (name, run) => {
  try { await run(); checks.push({ name, passed: true }); }
  catch (error) { checks.push({ name, passed: false, error: String(error) }); }
};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

if (grader === 'unchanged') {
  await check('Consultation leaves fixture files unchanged', async () => {
    for (const file of ['README.md', 'cache.mjs']) {
      assert.equal(await readFile(join(workspace, file), 'utf8'), await readFile(join(fixture, file), 'utf8'));
    }
  });
} else if (grader === 'title') {
  await check('Requested title and unchanged implementation', async () => {
    const original = await readFile(join(fixture, 'README.md'), 'utf8');
    assert.equal(await readFile(join(workspace, 'README.md'), 'utf8'),
      original.replace('# Lookup cache', '# Asynchronous lookup cache'));
    assert.equal(await readFile(join(workspace, 'cache.mjs'), 'utf8'), await readFile(join(fixture, 'cache.mjs'), 'utf8'));
  });
} else if (grader === 'cache') {
  const { createLookup } = await import(pathToFileURL(join(workspace, 'cache.mjs')).href);
  await check('Concurrent coalescing and successful value retention', async () => {
    const work = deferred();
    let calls = 0;
    const lookup = createLookup(() => { calls++; return work.promise; });
    const a = lookup.get('x'), b = lookup.get('x');
    await Promise.resolve();
    assert.equal(calls, 1);
    work.resolve('value');
    assert.deepEqual(await Promise.all([a, b, lookup.get('x')]), ['value', 'value', 'value']);
    assert.equal(await lookup.get('x'), 'value');
    assert.equal(calls, 1);
  });
  await check('Retry after asynchronous rejection and synchronous throw', async () => {
    for (const synchronous of [false, true]) {
      let calls = 0;
      const lookup = createLookup(() => {
        if (++calls > 1) return 'recovered';
        if (synchronous) throw new Error('failure');
        return Promise.reject(new Error('failure'));
      });
      await assert.rejects(async () => lookup.get('x'), /failure/);
      assert.equal(await lookup.get('x'), 'recovered');
      assert.equal(calls, 2);
    }
  });
  await check('Old success/rejection cannot replace/delete newer work after invalidation', async () => {
    for (const rejectOld of [false, true]) {
      for (const finishNewFirst of [false, true]) {
        const old = deferred(), fresh = deferred();
        let calls = 0;
        const lookup = createLookup(() => ++calls === 1 ? old.promise : fresh.promise);
        const a = lookup.get('x');
        const observedOld = Promise.resolve(a).then(value => value, error => error.message);
        await Promise.resolve();
        lookup.invalidate('x');
        const b = lookup.get('x');
        await Promise.resolve();
        if (finishNewFirst) { fresh.resolve('new'); await b; }
        if (rejectOld) old.reject(new Error('old failure')); else old.resolve('old');
        assert.equal(await observedOld, rejectOld ? 'old failure' : 'old');
        const c = lookup.get('x');
        fresh.resolve('new');
        assert.deepEqual(await Promise.all([b, c]), ['new', 'new']);
        assert.equal(await lookup.get('x'), 'new');
        assert.equal(calls, 2);
      }
    }
  });
} else throw new Error(`Unknown artifact grader: ${grader}`);

console.log(JSON.stringify({ grader, checks, passed: checks.every(check => check.passed) }));
process.exitCode = checks.every(check => check.passed) ? 0 : 1;
