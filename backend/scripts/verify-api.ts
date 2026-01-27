import express from 'express';
import { spawn } from 'child_process';
import axios from 'axios';
import path from 'path';

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const startServer = () => {
    console.log('🚀 Starting Backend Server for Testing...');
    const serverProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, '..'),
        shell: true,
        env: { ...process.env, PORT: PORT.toString() },
        stdio: 'pipe' // Capture output
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`[Server] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error] ${data}`);
    });

    return serverProcess;
};

const verifyApi = async () => {
    let serverProcess = null;
    try {
        // 1. Check if already running
        try {
            await axios.get(`${BASE_URL}/health`);
            console.log('✅ Server is already running.');
        } catch (e) {
            console.log('⚠️ Server not running. Starting it now...');
            serverProcess = startServer();
            // Wait for server to start
            let retries = 20;
            while (retries > 0) {
                await wait(2000);
                try {
                    await axios.get(`${BASE_URL}/health`);
                    console.log('✅ Server started successfully!');
                    break;
                } catch (err) {
                    process.stdout.write('.');
                    retries--;
                }
            }
            if (retries === 0) throw new Error('Server failed to start');
        }

        // 2. Test Smart Entry API
        console.log('\n🧪 Testing POST /api/transactions/smart...');
        const smartRes = await axios.post(`${BASE_URL}/api/transactions/smart`, {
            text: "Dinner at McDonald's 200"
        });
        console.log('✅ AI Response:', JSON.stringify(smartRes.data, null, 2));

        // 3. Test Get Transactions API
        console.log('\n🧪 Testing GET /api/transactions...');
        const listRes = await axios.get(`${BASE_URL}/api/transactions`, {
            params: { user_id: 'test-user', limit: 5 }
        });
        console.log(`✅ Fetched ${listRes.data.length} transactions.`);
        if (listRes.data.length > 0) {
            console.log('Sample:', listRes.data[0]);
        }

        console.log('\n🎉 ALL API TESTS PASSED!');

    } catch (err: any) {
        console.error('\n❌ API Test Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    } finally {
        if (serverProcess) {
            console.log('\nStopping temporary server...');
            // On Windows, killing the npm process might not kill the node child. 
            // We'll try to kill the port just in case, or rely on the user to restart properly.
            // For this test script, we just kill the process handle.
            const kill = require('tree-kill');
            kill(serverProcess.pid);
        }
    }
};

verifyApi();
