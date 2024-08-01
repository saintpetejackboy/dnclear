const mysql = require('mysql2/promise');
const { dbType, dbHost, dbPort, dbName, dbUser, dbPassword } = require('../config');

const createDbConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
    });
    console.log('Connected to the database');
    return connection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

module.exports = { createDbConnection };