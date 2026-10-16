import { spawnSync } from 'node:child_process';

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`);
}

// Never send test traffic to the real Website ID. Restore the normal deployment build afterwards.
try {
  run('npm', ['run', 'build'], {
    ...process.env,
    VITE_UMAMI_WEBSITE_ID: '00000000-0000-4000-8000-000000000001',
    VITE_UMAMI_HOSTNAME: '127.0.0.1',
  });
  run('npx', ['playwright', 'test', 'tests/umami.spec.ts'], { ...process.env, UMAMI_TEST: '1' });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  try {
    run('npm', ['run', 'build']);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
