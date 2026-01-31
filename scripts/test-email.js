const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Basic quote stripping
            if (key && val && !key.startsWith('#')) {
                process.env[key] = val;
            }
        }
    });
}

async function test() {
    console.log('Testing Email Configuration...');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        console.error('❌ EMAIL_USER or EMAIL_PASS missing in .env.local');
        return;
    }

    console.log(`User: ${user}`);
    console.log(`Pass: ${pass ? '********' : 'MISSING'}`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Verified Successfully!');
        console.log('Authentication is working. If the app fails, try restarting the dev server.');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:');
        console.error(error);
    }
}

test();
