const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.enable('trust proxy');

const connectionInfo = (process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME && process.env.CLOUD_SQL_CONNECTION_NAME)
  ? {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
  }
  : {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres'
  };

const pool = new Pool(connectionInfo);

app.get('/bars', async (req, res) => {
  const result = await pool.query('SELECT * FROM bar');
  res.json(result.rows);
});

app.post('/bars', async (req, res) => {
  const result = await pool.query('INSERT INTO bar(name) VALUES($1)', [req.body.name]);
  res.redirect('/');
});

app.listen(process.env.PORT || 5000);
