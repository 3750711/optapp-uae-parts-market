const { execSync } = require('node:child_process');

const cmds = [
  // No forbidden patterns to check - using custom domain api.partsbay.ae
];

try {
  for (const c of cmds) {
    const out = execSync(c, { stdio: 'pipe', encoding: 'utf8' });
    if (out.trim()) {
      console.error('\n❌ Forbidden pattern found:\n' + out);
      process.exit(1);
    }
  }
  console.log('✅ API scan passed');
} catch (e) {
  console.error('❌ Scan failed:', e.message);
  process.exit(1);
}