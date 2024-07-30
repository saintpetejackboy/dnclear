const express = require('express');
const { createClient } = require('redis');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Default path and filename for the .env file
const envPath = process.env.ENV_PATH || '/var/www/envfiles';
const envFileName = process.env.ENV_FILENAME || 'dnclear.env';

// Load environment variables from the specified .env file
dotenv.config({ path: path.join(envPath, envFileName) });

const app = express();
const port = 3131;
const apiToken = process.env.SECRET_KEY;

app.use(bodyParser.json());

// Initialize Redis client
const client = createClient({
    url: 'redis://127.0.0.1:6379'
});

client.on('connect', function() {
    console.log('Connected to Redis...');
});

client.on('ready', function() {
    console.log('Redis client ready to use...');
});

client.on('error', (err) => {
    console.error('Redis error: ', err);
});

client.on('end', function() {
    console.log('Redis connection closed');
});

// Middleware to check API token
app.use((req, res, next) => {
    const token = req.headers['x-api-key'] || req.body.customData['x-api-key'];
    if (token !== apiToken) {
        console.log(req);
        return res.status(403).json({ error: 'Forbidden' + req });
    }
    next();
});

// Ensure Redis client is connected before handling requests
app.use((req, res, next) => {
    if (!client.isOpen) {
        return res.status(500).json({ error: 'Redis client is not connected' });
    }
    next();
});

// Function to sanitize phone numbers
const sanitizePhoneNumber = (phoneNumber) => {
    let sanitized = phoneNumber.replace(/[^0-9]/g, '');
    if (sanitized.length === 11 && sanitized.startsWith('1')) {
        sanitized = sanitized.slice(1);
    } else if (sanitized.length === 12 && sanitized.startsWith('91')) {
        sanitized = sanitized.slice(2);
    }
    // Ensure the number is 10 digits long
    if (sanitized.length > 10) {
        sanitized = sanitized.slice(-10);
    }
    return sanitized;
};

// Endpoint to add a phone number
app.post('/dnc/add', async (req, res) => {
    console.log('Received request to add phone number');
    const phoneNumber = req.body.phone_number;
    if (!phoneNumber) {
        console.log('Phone number is missing in request');
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    try {
        const exists = await client.exists(sanitizedPhoneNumber);
        if (exists) {
            console.log('Phone number already exists:', sanitizedPhoneNumber);
            return res.status(409).json({ error: 'Phone number already exists' });
        }
        await client.set(sanitizedPhoneNumber, 'true');
        console.log('Phone number added:', sanitizedPhoneNumber);
        res.status(200).json({ phone_number: sanitizedPhoneNumber });
    } catch (err) {
        console.log('Error setting phone number in Redis', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to handle GHL webhook
app.post('/dnc/webhook/ghl', async (req, res) => {
    console.log('Received GHL webhook');

    const phoneNumber = req.body.phone; // Adjust this path according to the actual GHL payload structure

    if (!phoneNumber) {
        console.log('Phone number is missing in webhook payload');
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    try {
        const exists = await client.exists(sanitizedPhoneNumber);
        if (exists) {
            console.log('Phone number already exists:', sanitizedPhoneNumber);
            return res.status(200).json({ sanitizedPhoneNumber: 'Phone number already exists' });
        }
        await client.set(sanitizedPhoneNumber, 'true');
        console.log('Phone number added from webhook:', sanitizedPhoneNumber);
        res.status(200).json({ phone_number: sanitizedPhoneNumber });
    } catch (err) {
        console.log('Error setting phone number in Redis from webhook', err);
        res.status(500).json({ error: err.message });
    }
});


// Endpoint to check if a phone number is in the DNC list
app.get('/dnc/check', async (req, res) => {
    console.log('Received request to check phone number');
    const phoneNumber = req.query.phone_number;
    if (!phoneNumber) {
        console.log('Phone number is missing in request');
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    try {
        const reply = await client.get(sanitizedPhoneNumber);
        if (reply) {
            console.log('Phone number found:', sanitizedPhoneNumber);
            res.status(200).json({ phone_number: sanitizedPhoneNumber, in_dnc_list: true });
        } else {
            console.log('Phone number not found:', sanitizedPhoneNumber);
            res.status(200).json({ phone_number: sanitizedPhoneNumber, in_dnc_list: false });
        }
    } catch (err) {
        console.log('Error getting phone number from Redis', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to remove a phone number
app.delete('/dnc/remove', async (req, res) => {
    console.log('Received request to remove phone number');
    const phoneNumber = req.body.phone_number;
    if (!phoneNumber) {
        console.log('Phone number is missing in request');
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    try {
        const reply = await client.del(sanitizedPhoneNumber);
        if (reply === 0) {
            console.log('Phone number not found:', sanitizedPhoneNumber);
            return res.status(404).json({ error: 'Phone number not found' });
        }
        console.log('Phone number removed:', sanitizedPhoneNumber);
        res.status(200).json({ message: 'Phone number removed', phone_number: sanitizedPhoneNumber });
    } catch (err) {
        console.log('Error deleting phone number from Redis', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to list all phone numbers
app.get('/dnc', async (req, res) => {
    console.log('Received request to list all phone numbers');
    try {
        let cursor = '0';
        const phoneNumbers = [];
        do {
            const reply = await client.scan(cursor, 'MATCH', '*', 'COUNT', 100);
            console.log('SCAN reply:', reply);
            cursor = reply.cursor.toString();
            const keys = reply.keys;
            if (Array.isArray(keys)) {
                phoneNumbers.push(...keys);
            } else {
                console.log('Unexpected reply format from Redis SCAN:', reply);
                return res.status(500).json({ error: 'Unexpected reply format from Redis SCAN' });
            }
        } while (cursor !== '0');
        console.log('Phone numbers listed:', phoneNumbers);
        res.status(200).json({ phone_numbers: phoneNumbers });
    } catch (err) {
        console.log('Error listing phone numbers from Redis', err);
        res.status(500).json({ error: err.message });
    }
});


// Connect to Redis and start the server
client.connect().then(() => {
    app.listen(port, () => {
        console.log(`DNC endpoint listening at http://localhost:${port}`);
    });
}).catch(console.error);
