const dotenv = require('dotenv');
const path = require('path');

const envPath = process.env.ENV_PATH || '/var/www/envfiles';
const envFileName = process.env.ENV_FILENAME || 'dnclear.env';

dotenv.config({ path: path.join(envPath, envFileName) });

const config = {
    apiToken: process.env.SECRET_KEY,
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    dbType: process.env.DB_TYPE,
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
};

if (!config.apiToken) {
    console.error('SECRET_KEY is not set.');
    process.exit(1);
}

module.exports = config;
