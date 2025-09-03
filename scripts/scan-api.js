const { execSync } = require('node:child_process');

const cmds = [
  `grep -r "supabase\\.co" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . || true`,
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