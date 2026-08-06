/* Every environment variable Arena's scripts read, declared here so a test run or a
 * CI run needs no exports. A real environment variable wins over a value below, so a
 * one-off override stays a shell prefix rather than an edit to a versioned file.
 * CI is recognised and never declared: claiming it would tell the scripts they run on
 * a runner. ARENA_CHECK_STRICT buys the same thing and claims nothing. */

export const DECLARED = {
  CHROME_PATH: '/usr/bin/chromium',
  ARENA_CHECK_STRICT: '1',
  PORT: '8000',
};

export function arenaEnv(env: Record<string, string | undefined> = process.env) {
  return { ...DECLARED, ...env } as Record<string, string | undefined>;
}

export function skipExitCode(env = arenaEnv()) {
  return env.ARENA_CHECK_STRICT === '1' || env.CI === 'true' ? 1 : 2;
}
