const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { client } = require('./utils/redisClient');
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

// Centralized Error Handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Connect to Redis and start the server
client.connect().then(() => {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}).catch(console.error);
