const request = require('supertest');
const express = require('express');
const phoneNumbersRoutes = require('../routes/phoneNumbers');
const { client: redisClient } = require('../utils/redisClient');
require('dotenv').config();
const { apiToken, dbType } = require('../config');
const { createDbConnection } = require('../utils/dbClient');

const app = express();
app.use(express.json());
app.use('/dnc', phoneNumbersRoutes);

describe('Phone Numbers API', () => {
  let connection;

  beforeAll(async () => {
    if (dbType === 'redis') {
      if (!redisClient.isOpen) await redisClient.connect();
    } else {
      connection = await createDbConnection();
    }
  });
  
  afterAll(async () => {
    if (dbType === 'redis') {
      if (redisClient.isOpen) await redisClient.quit();
    } else {
      if (connection) await connection.end();
    }
  });

  beforeEach(async () => {
    if (dbType === 'redis') {
      await redisClient.flushAll();
    } else {
      await connection.execute('DELETE FROM phone_numbers');
    }
  });

  afterEach(async () => {
    // Clean up any remaining data after each test
    if (dbType === 'redis') {
      await redisClient.flushAll();
    } else {
      await connection.execute('DELETE FROM phone_numbers');
    }
  });

  test('POST /dnc/add should add a new phone number', async () => {
    const response = await request(app)
      .post('/dnc/add')
      .set('x-api-key', process.env.SECRET_KEY)
      .send({ phoneNumber: '1234567890' });
    expect(response.statusCode).toBe(200);
    expect(response.body.phone_number).toBe('1234567890');
  });

  test('POST /dnc/webhook/ghl should handle GHL webhook', async () => {
    const response = await request(app)
      .post('/dnc/webhook/ghl')
      .set('x-api-key', process.env.SECRET_KEY)
      .send({ phone: '9876543210' });
    expect(response.statusCode).toBe(200);
    expect(response.body.phone_number).toBe('9876543210');
  });

  test('GET /dnc should retrieve phone numbers with pagination', async () => {
    const testNumbers = ['1234567890', '9876543210'];
    if (dbType === 'redis') {
      await Promise.all(testNumbers.map(num => redisClient.set(num, 'true')));
    } else {
      await Promise.all(testNumbers.map(async (num) => {
        await connection.execute('INSERT INTO phone_numbers (phone_number) VALUES (?)', [num]);
      }));
    }

    const response = await request(app)
      .get('/dnc')
      .set('x-api-key', process.env.SECRET_KEY)
      .query({ page: 1, limit: 10 });

    expect(response.statusCode).toBe(200);
    expect(response.body.phone_numbers).toEqual(expect.arrayContaining(testNumbers));
    expect(response.body.total).toBe(testNumbers.length);
  });

  test('DELETE /dnc/remove should remove a phone number', async () => {
    const testNumber = '1234567890';
    if (dbType === 'redis') {
      await redisClient.set(testNumber, 'true');
    } else {
      await connection.execute('INSERT INTO phone_numbers (phone_number) VALUES (?)', [testNumber]);
    }

    const response = await request(app)
      .delete('/dnc/remove')
      .set('x-api-key', process.env.SECRET_KEY)
      .send({ phone_number: testNumber });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Phone number removed');

    // Verify the number is removed
    const checkResponse = await request(app)
      .get('/dnc/check')
      .set('x-api-key', process.env.SECRET_KEY)
      .query({ phone_number: testNumber });

    expect(checkResponse.body.in_dnc_list).toBeFalsy();
  });

  test('POST /dnc/batch-add should add multiple phone numbers', async () => {
    const response = await request(app)
      .post('/dnc/batch-add')
      .set('x-api-key', process.env.SECRET_KEY)
      .send({ phone_numbers: ['1234567890', '9876543210'] });
    expect(response.statusCode).toBe(200);
    expect(response.body.added_phone_numbers).toContain('1234567890');
    expect(response.body.added_phone_numbers).toContain('9876543210');
  });

  test('POST /dnc/batch-scan should scan multiple phone numbers in various formats', async () => {
    const normalizedNumber = '7272660666';
    if (dbType === 'redis') {
      await redisClient.set(normalizedNumber, 'true');
    } else {
      await connection.execute('INSERT INTO phone_numbers (phone_number) VALUES (?)', [normalizedNumber]);
    }
  
    const testNumbers = [
      '7272660666',
      '727-266-0666',
      '+17272660666',
      '+1 (727) 266-0666',
      '+1-(727)-266-0666',
      '17272660666'
    ];
  
    const response = await request(app)
      .post('/dnc/batch-scan')
      .set('x-api-key', process.env.SECRET_KEY)
      .send({ phone_numbers: testNumbers });
  
    expect(response.statusCode).toBe(200);
    expect(response.body.matched_phone_numbers).toEqual([normalizedNumber]);
  });

  test('POST /dnc/sync should synchronize data between Redis and database', async () => {
    const testNumbers = ['1234567890', '9876543210', '5555555555'];
  
    // Setup: Add numbers to the source storage
    if (dbType === 'redis') {
      await Promise.all(testNumbers.map(num => redisClient.set(num, 'true')));
    } else {
      await Promise.all(testNumbers.map(async (num) => {
        await connection.execute('INSERT INTO phone_numbers (phone_number) VALUES (?)', [num]);
      }));
    }
  
    // Perform sync operation
    const syncResponse = await request(app)
      .post('/dnc/sync')
      .set('x-api-key', process.env.SECRET_KEY);
  
    expect(syncResponse.statusCode).toBe(200);
    expect(syncResponse.body.message).toBe('Data synced successfully');
  
    // Verify sync results
    if (dbType === 'redis') {
      const dbConnection = await createDbConnection();
      const [rows] = await dbConnection.execute('SELECT phone_number FROM phone_numbers');
      await dbConnection.end();
      const dbNumbers = rows.map(row => row.phone_number);
      expect(dbNumbers.sort()).toEqual(testNumbers.sort());
    } else {
      const redisNumbers = await Promise.all(testNumbers.map(num => redisClient.get(num)));
      expect(redisNumbers.every(exists => exists === 'true')).toBe(true);
    }
  
    // Clean up: Remove the test data
    if (dbType === 'redis') {
      await Promise.all(testNumbers.map(num => redisClient.del(num)));
    } else {
      await connection.execute('DELETE FROM phone_numbers');
    }
  });
});
