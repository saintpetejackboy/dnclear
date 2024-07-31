const { createClient } = require('redis');
const { redisUrl } = require('../config');

const client = createClient({
    url: redisUrl
});

client.on('connect', () => console.log('Connected to Redis...'));
client.on('error', (err) => console.error('Redis error:', err));

module.exports = { client };
