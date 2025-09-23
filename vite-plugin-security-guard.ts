import { execSync } from 'child_process';
import path from 'path';
import type { Plugin } from 'vite';

interface SecurityGuardOptions {
  disabled?: boolean;
  scriptPath?: string;
}

/**
 * Vite plugin for security guard integration
 * Runs scripts/guard-no-password-logs.js before build
 */
export function securityGuardPlugin(options: SecurityGuardOptions = {}): Plugin {
  const { 
    disabled = false,
    scriptPath = 'scripts/guard-no-password-logs.js'
  } = options;

  return {
    name: 'security-guard',
    buildStart() {
      // Skip in development or if disabled
      if (disabled || process.env.NODE_ENV === 'development') {
        return;
      }

      console.log('🔒 Running security guard...');
      
      try {
        const scriptFullPath = path.resolve(process.cwd(), scriptPath);
        execSync(`node ${scriptFullPath}`, { 
          stdio: 'inherit',
          encoding: 'utf-8'
        });
        console.log('✅ Security guard passed');
      } catch (error) {
        console.error('❌ Security guard failed');
        throw new Error('Build stopped due to security violations');
      }
    }
  };
}