#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Patterns to search for
const patterns = [
  'functions/v1/',
  'api\\.partsbay\\.ae/functions/v1',
  '\\.supabase\\.co/functions/v1'
];

// Files to exclude from search
const excludePatterns = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'scripts/guard-no-functions-hardcode.js' // Exclude self
];

console.log('🔍 Checking for hardcoded Edge Function URLs...');

let foundHardcodes = false;
let totalFindings = 0;

patterns.forEach(pattern => {
  try {
    // Build grep command with exclusions
    const excludeArgs = excludePatterns.map(ex => `--exclude-dir=${ex}`).join(' ');
    const grepCmd = `grep -r ${excludeArgs} -n -i "${pattern}" . || true`;
    
    const output = execSync(grepCmd, { 
      encoding: 'utf-8',
      cwd: process.cwd()
    });
    
    if (output && output.trim()) {
      console.error(`\n❌ Found hardcoded pattern: ${pattern}`);
      console.error(output.trim());
      foundHardcodes = true;
      totalFindings += output.trim().split('\n').length;
    }
  } catch (error) {
    // grep returns non-zero exit code when no matches found, which is good
    if (error.status !== 1) {
      console.error(`Error searching for pattern ${pattern}:`, error.message);
    }
  }
});

if (foundHardcodes) {
  console.error(`\n💥 HARDCODE VIOLATION DETECTED!`);
  console.error(`Found ${totalFindings} hardcoded /functions/v1 reference(s).`);
  console.error(`\nRequired fixes:`);
  console.error(`- Replace fetch(..."/functions/v1/name"...) with supabase.functions.invoke('name')`);
  console.error(`- Replace SQL URLs with public.functions_url('name')`);
  console.error(`\nBuild stopped to prevent deployment of hardcoded URLs.`);
  process.exit(1);
} else {
  console.log('✅ No hardcoded /functions/v1 URLs found in source code.');
  console.log('✅ Build can proceed safely.');
}