const { spawn } = require('child_process');

async function run() {
  console.log('Starting dev server (npm run dev)...');
  const child = spawn('npm', ['run', 'dev'], { shell: true });

  let ready = false;
  let stdoutBuf = '';
  let detectedPort = 3000;

  // Match either "Local: http://localhost:XXXX" or "Compiled / in"
  const readyRegex = /Local:\s*http:\/\/localhost:(\d+)|Compiled \/ in/;

  child.stdout.on('data', (chunk) => {
    const s = chunk.toString();
    process.stdout.write(s);
    stdoutBuf += s;
    if (!ready) {
      const m = readyRegex.exec(stdoutBuf);
      if (m) {
        ready = true;
        if (m[1]) {
          detectedPort = parseInt(m[1], 10);
        }
        proceed();
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    const s = chunk.toString();
    process.stderr.write(s);
    stdoutBuf += s;
    if (!ready) {
      const m = readyRegex.exec(stdoutBuf);
      if (m) {
        ready = true;
        if (m[1]) {
          detectedPort = parseInt(m[1], 10);
        }
        proceed();
      }
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
  const base = `http://localhost:${detectedPort}`;
  console.log('\nGET / ->', base + '/');
  const resRoot = await fetchFn(base + '/');
      console.log('GET / status:', resRoot.status);
      const text = await resRoot.text();
      console.log('GET / body (first 400 chars):\n', text.slice(0, 400));

      // POST /api/generate
      console.log('\nPOST /api/generate');
      // Payload adjusted to match the server-side validation schema:
      const payload = {
        subject: 'Matemática',
        topic: 'Frações',
        grade: '5º ano',
        school_year: '5º ano',
        duration_minutes: 50,
        classSize: '30',
        bnccCodes: 'EF05MA03',
        objectives: 'Entender frações como partes de um todo',
        resources: 'Quadro, material concreto',
        constraints: 'Sem acesso a internet',
      };

  const includeRaw = process.env.INCLUDE_RAW === 'true';
  const headers = { 'Content-Type': 'application/json' };
  if (includeRaw) headers['x-include-raw'] = 'true';

  const resGen = await fetchFn(base + '/api/generate', {
        method: 'POST',
    headers,
        body: JSON.stringify(payload),
      });

      console.log('POST /api/generate status:', resGen.status);
      const bodyGen = await resGen.text();

      if (resGen.status >= 400) {
        console.error('\nAPI returned an error. Summary:');
        try {
          const parsedErr = JSON.parse(bodyGen);
          console.error('ok:', parsedErr.ok);
          console.error('error message:', parsedErr.error);
        } catch (e) {
          // fallback to raw
          console.error('raw body:', bodyGen.slice(0, 1000));
        }

        // Detect common GoogleGenerativeAI errors and suggest remedies
        if (bodyGen.includes('GoogleGenerativeAI')) {
          console.error('\nDetected GoogleGenerativeAI error. Likely causes:');
          console.error('- The library call shape used by the server does not match the remote API (client library or API version mismatch).');
          console.error('- Or the environment variables (GOOGLE_API_KEY / GEMINI_MODEL) are missing/incorrect.');
          console.error('\nSuggestions: set a valid GOOGLE_API_KEY and ensure GEMINI_MODEL is correct, or run integration tests which mock the generative client.');
        }
      } else {
        console.log('POST /api/generate body (first 800 chars):\n', bodyGen.slice(0, 800));
      }

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
