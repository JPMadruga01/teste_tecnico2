const { spawn } = require('child_process');

async function run() {
  console.log('Starting dev server (npm run dev)...');
  const child = spawn('npm', ['run', 'dev'], { shell: true });

  let ready = false;
  let stdoutBuf = '';

  const readyRegex = /Local:\s*http:\/\/localhost:3000|Compiled \/ in/;

  child.stdout.on('data', (chunk) => {
    const s = chunk.toString();
    process.stdout.write(s);
    stdoutBuf += s;
    if (!ready && readyRegex.test(stdoutBuf)) {
      ready = true;
      proceed();
    }
  });

  child.stderr.on('data', (chunk) => {
    const s = chunk.toString();
    process.stderr.write(s);
    stdoutBuf += s;
    if (!ready && readyRegex.test(stdoutBuf)) {
      ready = true;
      proceed();
    }
  });

  child.on('exit', (code, signal) => {
    console.log(`Dev server exited (code=${code} signal=${signal})`);
    if (!ready) process.exit(1);
  });

  // safety timeout
  const timeout = setTimeout(() => {
    if (!ready) {
      console.error('Timed out waiting for dev server to become ready.');
      child.kill();
      process.exit(2);
    }
  }, 60000);

  async function proceed() {
    clearTimeout(timeout);
    console.log('\nDev server ready — running endpoint checks...');

    try {
      // use global fetch if available, otherwise dynamic import
      let fetchFn;
      if (typeof global.fetch === 'function') {
        fetchFn = global.fetch;
      } else {
        fetchFn = (await import('node-fetch')).default;
      }

      // GET /
      console.log('\nGET /');
      const resRoot = await fetchFn('http://localhost:3000/');
      console.log('GET / status:', resRoot.status);
      const text = await resRoot.text();
      console.log('GET / body (first 400 chars):\n', text.slice(0, 400));

      // POST /api/generate
      console.log('\nPOST /api/generate');
      const payload = {
        subject: 'Matemática',
        topic: 'Frações',
        grade: '5º ano',
        duration: '50 minutos',
        classSize: '30',
        bnccCodes: 'EF05MA03',
        objectives: 'Entender frações como partes de um todo',
        resources: 'Quadro, material concreto',
        constraints: 'Sem acesso a internet',
      };

      const resGen = await fetchFn('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('POST /api/generate status:', resGen.status);
      const bodyGen = await resGen.text();
      console.log('POST /api/generate body (first 800 chars):\n', bodyGen.slice(0, 800));

      // Shutdown server
      console.log('\nEndpoint checks complete — shutting down dev server.');
      child.kill();
      process.exit(0);
    } catch (err) {
      console.error('Error during endpoint checks:', err);
      child.kill();
      process.exit(3);
    }
  }
}

run();
