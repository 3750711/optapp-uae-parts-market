const { execSync } = require('node:child_process');

const CMD = "git ls-files | grep -E '\\.(ts|tsx|js|jsx)$' | xargs grep -nEI";
const patterns = [
  'console\\.(log|info|warn|error)\\(.*password',
  'password\\s*:\\s*[^*]',
  'SUPABASE_SERVICE_ROLE',
  'service[_-]?role'
];

let hit = '';
for (const p of patterns) {
  try {
    const out = execSync(`${CMD} "${p}"`, {stdio:['ignore','pipe','pipe']}).toString();
    if (out.trim()) hit += `\n${out}`;
  } catch (error) {
    // Ignore grep not finding matches
  }
}

if (hit) {
  console.error('\n❌ Sensitive patterns detected:\n' + hit);
  process.exit(1);
}

console.log('✅ No obvious sensitive logs.');