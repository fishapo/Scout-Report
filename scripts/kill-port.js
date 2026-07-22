#!/usr/bin/env node
/**
 * Kill any process listening on the configured port
 * Cross-platform solution for Windows, macOS, and Linux
 */

const { exec } = require('child_process');
const path = require('path');
const os = require('os');

// Load PORT from .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 8080;
const isWindows = os.platform() === 'win32';

function killPort(port) {
  return new Promise((resolve, reject) => {
    if (isWindows) {
      // Windows: use netstat and taskkill
      const findCommand = `netstat -ano | findstr :${port}`;
      exec(findCommand, (error, stdout) => {
        if (error || !stdout.trim()) {
          // No process found, that's fine
          console.log(`✓ Port ${port} is free`);
          resolve();
          return;
        }

        // Extract PID from netstat output
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            pids.add(parts[4]); // PID is typically the 5th column
          }
        });

        if (pids.size === 0) {
          console.log(`✓ Port ${port} is free`);
          resolve();
          return;
        }

        // Kill each PID
        let killed = 0;
        pids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, (error) => {
            if (!error) {
              console.log(`✓ Killed process ${pid} on port ${port}`);
              killed++;
            }
            if (killed === pids.size) {
              setTimeout(() => resolve(), 500); // Wait 500ms for cleanup
            }
          });
        });
      });
    } else {
      // macOS/Linux: use lsof and kill
      const findCommand = `lsof -i :${port} -t`;
      exec(findCommand, (error, stdout) => {
        if (error || !stdout.trim()) {
          // No process found, that's fine
          console.log(`✓ Port ${port} is free`);
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n');
        const killCommand = `kill -9 ${pids.join(' ')}`;
        
        exec(killCommand, (error) => {
          if (error) {
            console.warn(`⚠ Warning: Could not kill processes on port ${port}`);
          } else {
            console.log(`✓ Killed processes on port ${port}: ${pids.join(', ')}`);
          }
          setTimeout(() => resolve(), 500); // Wait 500ms for cleanup
        });
      });
    }
  });
}

// Run the cleanup
killPort(PORT).catch(error => {
  console.error(`✗ Error cleaning port ${PORT}:`, error.message);
  process.exit(1);
});
