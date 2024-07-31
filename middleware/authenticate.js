const { apiToken } = require('../config');

const authenticate = (req, res, next) => {
    const token = req.headers['x-api-key'] || (req.body.customData ? req.body.customData['x-api-key'] : null);
    if (token !== apiToken) {
        console.log('Invalid API key:', token);
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

module.exports = authenticate;
