const { execSync } = require('node:child_process');

const CMD = "git ls-files | grep -E '\\.(ts|tsx|js|jsx)$' | xargs grep -nEI";
const patterns = [
  // Password logging patterns
  'console\\.(log|info|warn|error)\\(.*password',
  'password\\s*:\\s*[^*]',
  
  // Token logging patterns  
  'console\\.(log|info|warn|error)\\(.*token',
  'access[_-]?token\\s*:\\s*[^*]',
  'refresh[_-]?token\\s*:\\s*[^*]',
  'recovery[_-]?token\\s*:\\s*[^*]',
  
  // Service role and API keys
  'SUPABASE_SERVICE_ROLE',
  'service[_-]?role',
  'api[_-]?key\\s*:\\s*[^*]',
  
  // Other sensitive patterns
  'console\\.(log|info|warn|error)\\(.*secret',
  'console\\.(log|info|warn|error)\\(.*credential',
  'private[_-]?key\\s*:\\s*[^*]',
  
  // Direct console usage without secure logger (excluding secureLogger.ts itself)
  '^(?!.*secureLogger).*console\\.(log|error|warn|info)\\(',
];

let hit = '';
const excludePatterns = [
  'secureLogger\\.ts',     // Exclude the secure logger itself
  'guard-no-password',     // Exclude the guard script
  'test\\.',              // Exclude test files 
  '\\.test\\.',           // Exclude test files
];

for (const p of patterns) {
  try {
    const out = execSync(`${CMD} "${p}"`, {stdio:['ignore','pipe','pipe']}).toString();
    if (out.trim()) {
      // Filter out excluded files
      const lines = out.split('\n').filter(line => {
        return line.trim() && !excludePatterns.some(exclude => 
          new RegExp(exclude).test(line)
        );
      });
      if (lines.length > 0) {
        hit += `\nPattern: ${p}\n${lines.join('\n')}`;
      }
    }
  } catch (error) {
    // Ignore grep not finding matches
  }
}

if (hit) {
  console.error('\n❌ Sensitive patterns detected:\n' + hit);
  process.exit(1);
}

console.log('✅ No obvious sensitive logs.');