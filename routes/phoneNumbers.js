const express = require('express');
const router = express.Router();
const { client } = require('../utils/redisClient');
const { sanitizePhoneNumber } = require('../utils/helpers');

// Middleware for error handling
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Endpoint to add a phone number
router.post('/add', asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    const exists = await client.exists(sanitizedPhoneNumber);
    if (exists) {
        return res.status(409).json({ error: 'Phone number already exists' });
    }
    await client.set(sanitizedPhoneNumber, 'true');
    res.status(200).json({ phone_number: sanitizedPhoneNumber });
}));

// Endpoint to handle GHL webhook
router.post('/webhook/ghl', asyncHandler(async (req, res) => {
    console.log('Received GHL webhook');
    const { phone: phoneNumber } = req.body; // Adjust this path according to the actual GHL payload structure

    if (!phoneNumber) {
        console.log('Phone number is missing in webhook payload');
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    const exists = await client.exists(sanitizedPhoneNumber);
    if (exists) {
        console.log('Phone number already exists:', sanitizedPhoneNumber);
        return res.status(200).json({ message: 'Phone number already exists' });
    }
    await client.set(sanitizedPhoneNumber, 'true');
    console.log('Phone number added from webhook:', sanitizedPhoneNumber);
    res.status(200).json({ phone_number: sanitizedPhoneNumber });
}));

// Endpoint to check if a phone number is in the DNC list
router.get('/check', asyncHandler(async (req, res) => {
    const { phone_number: phoneNumber } = req.query;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    const reply = await client.get(sanitizedPhoneNumber);
    const inDncList = reply !== null;
    res.status(200).json({ phone_number: sanitizedPhoneNumber, in_dnc_list: inDncList });
}));

// Endpoint to remove a phone number
router.delete('/remove', asyncHandler(async (req, res) => {
    const { phone_number: phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    const reply = await client.del(sanitizedPhoneNumber);
    if (reply === 0) {
        return res.status(404).json({ error: 'Phone number not found' });
    }
    res.status(200).json({ message: 'Phone number removed', phone_number: sanitizedPhoneNumber });
}));

// Endpoint to retrieve all phone numbers
router.get('/', asyncHandler(async (req, res) => {
    try {
        let cursor = '0';
        const phoneNumbers = [];
        const maxIterations = 1000; // Safeguard to prevent infinite loop
        let iterationCount = 0;

        do {
            const reply = await client.scan(cursor, 'MATCH', '*', 'COUNT', 100);
            cursor = reply.cursor.toString();
            const keys = reply.keys;

            if (!Array.isArray(keys)) {
                console.error('Expected keys to be an array but got:', typeof keys, 'with keys:', keys);
                return res.status(500).json({ error: 'Unexpected format for keys' });
            }

            phoneNumbers.push(...keys.map(key => sanitizePhoneNumber(key)));
            console.log('Requesting a complete scan...'); // Logging the cursor

            iterationCount++;
            if (iterationCount > maxIterations) {
                console.error('Exceeded maximum iterations');
                return res.status(500).json({ error: 'Exceeded maximum iterations' });
            }

        } while (cursor !== '0');

        res.status(200).json({ phone_numbers: phoneNumbers });
    } catch (err) {
        console.error('Error in SCAN operation:', err);
        res.status(500).json({ error: err.message });
    }
}));

module.exports = router;
