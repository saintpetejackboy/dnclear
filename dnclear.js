const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { client, connectRedis } = require('./utils/redisClient');
const authenticate = require('./middleware/authenticate');
const phoneNumberRoutes = require('./routes/phoneNumbers');

const envPath = process.env.ENV_PATH || '/var/www/envfiles';
const envFileName = process.env.ENV_FILENAME || 'dnclear.env';
dotenv.config({ path: path.join(envPath, envFileName) });

const app = express();
const port = process.env.PORT || 3131;

app.use(express.json());

// Middleware
app.use(authenticate);

// Routes
app.use('/dnc', phoneNumberRoutes);

app.use('/dnc/dump-csv', (req, res, next) => {
    next();
});

// Centralized Error Handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Connect to Redis and start the server
async function startServer() {
  try {
    await connectRedis();
    console.log('Connected to Redis');

    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await client.quit();
    console.log('Redis client disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
});