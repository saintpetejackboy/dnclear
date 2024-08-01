const { createClient } = require('redis');
const { redisUrl } = require('../config');

const client = createClient({
  url: redisUrl,
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('error', (err) => console.log('Redis Client Error', err));

let connectionPromise = null;

const connectRedis = async () => {
  if (!connectionPromise) {
    connectionPromise = client.connect();
  }
  return connectionPromise;
};

module.exports = { client, connectRedis };