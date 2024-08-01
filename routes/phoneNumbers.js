const express = require('express');
const router = express.Router();
const { client } = require('../utils/redisClient');
const { sanitizePhoneNumber } = require('../utils/helpers');
const { createObjectCsvStringifier } = require('csv-writer');
const { dbType } = require('../config');
const { createDbConnection } = require('../utils/dbClient');

// Middleware for error handling
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const addPhoneNumberToDb = async (phoneNumber) => {
  try {
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    const connection = await createDbConnection();
    await connection.execute('INSERT INTO phone_numbers (phone_number) VALUES (?)', [sanitizedPhoneNumber]);
    await connection.end();
    return sanitizedPhoneNumber;
  } catch (error) {
    throw new Error(`Error adding phone number to database: ${error.message}`);
  }
};

const isPhoneNumberExists = async (phoneNumber) => {
  try {
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    return await client.exists(sanitizedPhoneNumber);
  } catch (error) {
    throw new Error(`Error checking phone number existence in Redis: ${error.message}`);
  }
};

const isPhoneNumberExistsInDb = async (phoneNumber) => {
  try {
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    const connection = await createDbConnection();
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM phone_numbers WHERE phone_number = ?', [sanitizedPhoneNumber]);
    await connection.end();
    return rows[0].count > 0;
  } catch (error) {
    throw new Error(`Error checking phone number existence in database: ${error.message}`);
  }
};

// Helper function to add a phone number to Redis
const addPhoneNumber = async (phoneNumber) => {
  try {
    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    await client.set(sanitizedPhoneNumber, 'true');
    return sanitizedPhoneNumber;
  } catch (error) {
    throw new Error(`Error adding phone number to Redis: ${error.message}`);
  }
};

// Helper function to retrieve phone numbers with pagination
const getPhoneNumbers = async (page, limit) => {
  try {
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

    return {
      phone_numbers: results,
      page,
      limit,
      total: count
    };
  } catch (error) {
    throw new Error(`Error retrieving phone numbers from Redis: ${error.message}`);
  }
};

// Endpoint to add a phone number
// Endpoint to add a phone number
router.post('/add', asyncHandler(async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
  
      const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
      if (!/^\d{10}$/.test(sanitizedPhoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number' });
      }
  
      let exists;
      if (dbType === 'redis') {
        exists = await isPhoneNumberExists(phoneNumber);
      } else {
        exists = await isPhoneNumberExistsInDb(phoneNumber);
      }
  
      if (exists) {
        return res.status(409).json({ error: 'Phone number already exists' });
      }
  
      if (dbType === 'redis') {
        await addPhoneNumber(phoneNumber);
      } else {
        await addPhoneNumberToDb(phoneNumber);
      }
  
      res.status(200).json({ phone_number: sanitizedPhoneNumber });
    } catch (error) {
      console.error('Error adding phone number:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }));

// Endpoint to handle GHL webhook
router.post('/webhook/ghl', asyncHandler(async (req, res) => {
  try {
    console.log('Received GHL webhook');
    const { phone: phoneNumber } = req.body;

    if (!phoneNumber) {
      console.log('Phone number is missing in webhook payload');
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let exists;
    if (dbType === 'redis') {
      exists = await isPhoneNumberExists(phoneNumber);
    } else {
      exists = await isPhoneNumberExistsInDb(phoneNumber);
    }

    if (exists) {
      console.log('Phone number already exists:', phoneNumber);
      return res.status(200).json({ message: 'Phone number already exists' });
    }

    let sanitizedPhoneNumber;
    if (dbType === 'redis') {
      sanitizedPhoneNumber = await addPhoneNumber(phoneNumber);
    } else {
      sanitizedPhoneNumber = await addPhoneNumberToDb(phoneNumber);
    }

    console.log('Phone number added from webhook:', sanitizedPhoneNumber);
    res.status(200).json({ phone_number: sanitizedPhoneNumber });
  } catch (error) {
    console.error('Error handling GHL webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}));

// Endpoint to check if a phone number is in the DNC list
router.get('/check', asyncHandler(async (req, res) => {
  try {
    const { phone_number: phoneNumber } = req.query;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let inDncList;
    if (dbType === 'redis') {
      inDncList = await isPhoneNumberExists(phoneNumber);
    } else {
      inDncList = await isPhoneNumberExistsInDb(phoneNumber);
    }

    res.status(200).json({ phone_number: sanitizePhoneNumber(phoneNumber), in_dnc_list: inDncList });
  } catch (error) {
    console.error('Error checking phone number in DNC list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}));

// Endpoint to remove a phone number
router.delete('/remove', asyncHandler(async (req, res) => {
  try {
    const { phone_number: phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
    let reply;
    if (dbType === 'redis') {
      reply = await client.del(sanitizedPhoneNumber);
    } else {
      const connection = await createDbConnection();
      const [result] = await connection.execute('DELETE FROM phone_numbers WHERE phone_number = ?', [sanitizedPhoneNumber]);
      await connection.end();
      reply = result.affectedRows;
    }

    if (reply === 0) {
      return res.status(404).json({ error: 'Phone number not found' });
    }

    res.status(200).json({ message: 'Phone number removed', phone_number: sanitizedPhoneNumber });
  } catch (error) {
    console.error('Error removing phone number:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}));

// Endpoint to retrieve all phone numbers
router.get('/', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    let phoneNumbersData;
    if (dbType === 'redis') {
      phoneNumbersData = await getPhoneNumbers(page, limit);
    } else {
      const startIndex = (page - 1) * limit;
      const connection = await createDbConnection();
      try {
        const [rows] = await connection.execute('SELECT phone_number FROM phone_numbers LIMIT ? OFFSET ?', [limit, startIndex]);
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM phone_numbers');
        const phoneNumbers = rows.map(row => row.phone_number);
        const total = countResult[0].total;
        phoneNumbersData = {
          phone_numbers: phoneNumbers,
          page,
          limit,
          total
        };
      } finally {
        await connection.end();
      }
    }

    res.status(200).json(phoneNumbersData);
  } catch (error) {
    console.error('Error retrieving phone numbers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}));

// Endpoint to dump data to CSV
router.get('/dump-csv', asyncHandler(async (req, res) => {
  try {
    let allKeys;
    if (dbType === 'redis') {
      let cursor = '0';
      allKeys = [];
      do {
        const reply = await client.scan(cursor, 'MATCH', '*', 'COUNT', 1000);
        cursor = reply.cursor.toString();
        allKeys.push(...reply.keys);
      } while (cursor !== '0');
    } else {
      const connection = await createDbConnection();
      const [rows] = await connection.execute('SELECT phone_number FROM phone_numbers');
      await connection.end();
      allKeys = rows.map(row => row.phone_number);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dnc_dump.csv"');

    const csvStringifier = createObjectCsvStringifier({
      header: [{ id: 'phoneNumber', title: 'Phone Number' }]
    });

    res.write(csvStringifier.getHeaderString());

    for (const key of allKeys) {
      const row = { phoneNumber: sanitizePhoneNumber(key) };
      res.write(csvStringifier.stringifyRecords([row]));
    }

    res.end();
  } catch (error) {
    console.error('Error dumping data to CSV:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}));

// Endpoint to add multiple phone numbers
router.post('/batch-add', asyncHandler(async (req, res) => {
  try {
    const { phone_numbers: phoneNumbers } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ error: 'Phone numbers array is required' });
    }

    const sanitizedPhoneNumbers = phoneNumbers.map(sanitizePhoneNumber);
    if (dbType === 'redis') {
      const multi = client.multi();
      sanitizedPhoneNumbers.forEach(number => multi.set(number, 'true'));
      await multi.exec();
    } else {
      const connection = await createDbConnection();
      for (const phoneNumber of sanitizedPhoneNumbers) {
        await connection.execute('INSERT IGNORE INTO phone_numbers (phone_number) VALUES (?)', [phoneNumber]);
      }
      await connection.end();
    }

    res.status(200).json({ added_phone_numbers: sanitizedPhoneNumbers });
  } catch (error) {
    console.error('Error adding multiple phone numbers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}));

// Endpoint to scan multiple phone numbers
router.post('/batch-scan', asyncHandler(async (req, res) => {
  try {
    const { phone_numbers: phoneNumbers } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ error: 'Phone numbers array is required' });
    }

    const sanitizedPhoneNumbers = phoneNumbers.map(sanitizePhoneNumber);
    let matchedPhoneNumbers;
    if (dbType === 'redis') {
      const existingPhoneNumbers = await Promise.all(sanitizedPhoneNumbers.map(isPhoneNumberExists));
      matchedPhoneNumbers = sanitizedPhoneNumbers.filter((_, index) => existingPhoneNumbers[index]);
    } else {
      const existingPhoneNumbers = await Promise.all(sanitizedPhoneNumbers.map(isPhoneNumberExistsInDb));
      matchedPhoneNumbers = sanitizedPhoneNumbers.filter((_, index) => existingPhoneNumbers[index]);
    }

    // Ensure matchedPhoneNumbers contains unique values
    const uniqueMatchedPhoneNumbers = [...new Set(matchedPhoneNumbers)];

    res.status(200).json({ matched_phone_numbers: uniqueMatchedPhoneNumbers });
  } catch (error) {
    console.error('Error scanning multiple phone numbers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}));

// Endpoint to sync data between Redis and the database
router.post('/sync', asyncHandler(async (req, res) => {
  try {
    if (!client.isOpen) {
      await client.connect();
    }

    console.log('Starting sync process');
    if (dbType === 'redis') {
      console.log('Syncing from Redis to database');
      // Sync from Redis to the database
      let cursor = '0';
      const connection = await createDbConnection();
      do {
        const reply = await client.scan(cursor, 'MATCH', '*', 'COUNT', 1000);
        cursor = reply.cursor.toString();
        const phoneNumbers = reply.keys.map(sanitizePhoneNumber);
        for (const phoneNumber of phoneNumbers) {
          await connection.execute('INSERT IGNORE INTO phone_numbers (phone_number) VALUES (?)', [phoneNumber]);
        }
      } while (cursor !== '0');
      await connection.end();
    } else {
      console.log('Syncing from database to Redis');
      // Sync from the database to Redis
      const connection = await createDbConnection();
      const [rows] = await connection.execute('SELECT phone_number FROM phone_numbers');
      await connection.end();
      const multi = client.multi();
      rows.forEach(row => multi.set(row.phone_number, 'true'));
      await multi.exec();
    }
    console.log('Sync process completed');
    res.status(200).json({ message: 'Data synced successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message, stack: error.stack });
  }
}));

module.exports = router;