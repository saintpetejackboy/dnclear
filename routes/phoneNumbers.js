const express = require('express');
const router = express.Router();
const { client } = require('../utils/redisClient');
const { sanitizePhoneNumber } = require('../utils/helpers');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const os = require('os'); 

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
    const { phone: phoneNumber } = req.body; 

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const startIndex = (page - 1) * limit;
  
    let cursor = '0';
    const phoneNumbers = [];
    let count = 0;
  
    do {
      const reply = await client.scan(cursor, 'MATCH', '*', 'COUNT', 1000);
      cursor = reply.cursor.toString();
      const keys = reply.keys;
  
      phoneNumbers.push(...keys.map(key => sanitizePhoneNumber(key)));
      count += keys.length;
  
      if (count >= startIndex + limit) break;
    } while (cursor !== '0' && phoneNumbers.length < startIndex + limit);
  
    const results = phoneNumbers.slice(startIndex, startIndex + limit);
  
    res.status(200).json({
      phone_numbers: results,
      page,
      limit,
      total: count
    });
  }));
  
// New endpoint to dump Redis data to CSV
router.get('/dump-csv', asyncHandler(async (req, res) => {
    let cursor = '0';
    const allKeys = [];

    do {
        const reply = await client.scan(cursor, 'MATCH', '*', 'COUNT', 1000);
        cursor = reply.cursor.toString();
        allKeys.push(...reply.keys);
    } while (cursor !== '0');

    const tempDir = os.tmpdir(); 
    const filePath = path.join(tempDir, `redis_dump_${Date.now()}.csv`);

    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            {id: 'phoneNumber', title: 'Phone Number'}
        ]
    });

    const data = allKeys.map(key => ({
        phoneNumber: sanitizePhoneNumber(key)
    }));

    await csvWriter.writeRecords(data);

    res.download(filePath, 'redis_dump.csv', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
        // Delete the file after sending
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
    });
}));

module.exports = router;
