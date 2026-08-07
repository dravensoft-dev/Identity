import test from 'node:test';
import assert from 'node:assert/strict';
import { DECLARED, arenaEnv, skipExitCode } from './arena-scripts-vars.ts';

test('a declared value fills a variable the environment does not carry', () => {
  assert.equal(arenaEnv({}).ARENA_CHECK_STRICT, DECLARED.ARENA_CHECK_STRICT);
  assert.equal(arenaEnv({}).CHROME_PATH, DECLARED.CHROME_PATH);
  assert.equal(arenaEnv({}).PORT, DECLARED.PORT);
});

test('a real environment variable wins over the declared one', () => {
  assert.equal(arenaEnv({ ARENA_CHECK_STRICT: '0' }).ARENA_CHECK_STRICT, '0');
  assert.equal(arenaEnv({ CHROME_PATH: '/opt/other' }).CHROME_PATH, '/opt/other');
});

test('a variable the repository does not declare passes through untouched', () => {
  assert.equal(arenaEnv({ CI: 'true' }).CI, 'true');
  assert.equal(arenaEnv({}).CI, undefined);
});

test('arenaEnv copies rather than mutating what it was handed', () => {
  const env = {};
  arenaEnv(env);
  assert.deepEqual(env, {});
});

test('skipExitCode is 2 normally and 1 under strict', () => {
  assert.equal(skipExitCode({}), 2);
  assert.equal(skipExitCode({ ARENA_CHECK_STRICT: '1' }), 1);
  assert.equal(skipExitCode({ CI: 'true' }), 1);
});

test('only the exact strings count, so a truthy-looking value does not turn strict on', () => {
  assert.equal(skipExitCode({ ARENA_CHECK_STRICT: 'true' }), 2);
  assert.equal(skipExitCode({ CI: '1' }), 2);
});

test('the repository declares itself strict, so a gate that cannot run fails rather than skips', () => {
  assert.equal(DECLARED.ARENA_CHECK_STRICT, '1');
  assert.equal(skipExitCode(arenaEnv({})), 1);
});

test('called with nothing it reads arenaEnv, which is what makes a declared value reach a gate', () => {
  assert.equal(skipExitCode(), skipExitCode(arenaEnv()));
});

test('an exported ARENA_CHECK_STRICT=0 buys the soft skip back', () => {
  assert.equal(skipExitCode(arenaEnv({ ARENA_CHECK_STRICT: '0' })), 2);
});
