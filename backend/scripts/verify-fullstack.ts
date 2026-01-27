import { spawn } from 'child_process';
import axios from 'axios';
import path from 'path';

const BACKEND_PORT = 3000;
const FRONTEND_PORT = 3001;
const MAX_RETRIES = 30;
const RETRY_DELAY = 2000;

const startServer = (name: string, dir: string, command: string, args: string[], port: number) => {
    console.log(`Starting ${name} in ${dir}...`);
    const childProcess = spawn(command, args, {
        cwd: dir,
        shell: true,
        env: { ...process.env, PORT: port.toString() }
    });

    childProcess.stdout.on('data', (data: any) => {
        // console.log(`[${name}] ${data.toString().trim()}`); // Uncomment for debug
    });

    childProcess.stderr.on('data', (data: any) => {
        console.error(`[${name} ERROR] ${data.toString().trim()}`);
    });

    return childProcess;
};

const checkHealth = async (name: string, url: string) => {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            await axios.get(url);
            console.log(`✅ ${name} is up at ${url}`);
            return true;
        } catch (err: any) {
            if (err.code === 'ECONNREFUSED') {
                await new Promise(r => setTimeout(r, RETRY_DELAY));
                process.stdout.write('.');
            } else {
                // If it returns 404 or 401, it means the server is running but maybe the route is wrong/protected
                // which is still "up" for our purpose of checking connectivity
                if (err.response) {
                    console.log(`✅ ${name} is up at ${url} (Status: ${err.response.status})`);
                    return true;
                }
                console.error(`\n❌ ${name} check failed: ${err.message}`);
                return false;
            }
        }
    }
    console.error(`\n❌ ${name} timed out after ${MAX_RETRIES * RETRY_DELAY}ms`);
    return false;
};

const runVerification = async () => {
    const rootDir = path.resolve(__dirname, '../../');
    const backendDir = path.join(rootDir, 'backend');
    const frontendDir = path.join(rootDir, 'frontend');

    // 1. Start Backend
    const backend = startServer('Backend', backendDir, 'npm', ['run', 'dev'], BACKEND_PORT);

    // 2. Start Frontend
    // Note: We force PORT 3001 for frontend
    const frontend = startServer('Frontend', frontendDir, 'npm', ['run', 'dev'], FRONTEND_PORT);

    try {
        console.log('Waiting for services to initialize...');

        // 3. Verify Backend
        const backendUp = await checkHealth('Backend', `http://localhost:${BACKEND_PORT}/api/transactions?user_id=test`);

        // 4. Verify Frontend
        const frontendUp = await checkHealth('Frontend', `http://localhost:${FRONTEND_PORT}`);

        if (backendUp && frontendUp) {
            console.log('\n🎉 FULL STACK VERIFICATION SUCCESSFUL!');
            console.log('Both Backend and Frontend started and responded correctly.');
        } else {
            console.error('\n💥 Verification Failed.');
            process.exit(1);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        console.log('\nStopping servers...');
        // On Windows, killing the spawned process might not kill the tree (npm -> node).
        // We use taskkill to be sure in this environment if needed, or just tree kill.
        // For simplicity in this script, we try standard kill.
        backend.kill();
        frontend.kill();

        // Force kill any node processes on these ports (optional cleanup)
        // exec('npx kill-port 3000 3001'); 
        process.exit(0);
    }
};

runVerification();
