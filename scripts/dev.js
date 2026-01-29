const { spawn } = require('child_process');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`\n🌐 Network: http://${localIP}:3000\n`);

// Start Next.js with 0.0.0.0 to bind to all interfaces
const nextProcess = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
});

nextProcess.on('close', (code) => {
  process.exit(code);
});

