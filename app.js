const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.enable('trust proxy');

async function devPostgres() {
  console.log('Starting Postgres');

  const {GenericContainer} = require('testcontainers');

  const containerPromise = new GenericContainer('postgres')
    .withExposedPorts(5432)
    .withTmpFs({'/temp_pgdata': 'rw,noexec,nosuid,size=65536k'})
    .start();

  return containerPromise.then(async container => {
    console.log('Postgres Started');

    async function stop(signal) {
      console.log('Stopping Postgres');
      await container.stop();
      process.kill(process.pid, signal);
    }

    process.once('SIGUSR2', stop);
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);

    return {
      host: container.getContainerIpAddress(),
      port: container.getMappedPort(5432),
      user: 'postgres',
      database: 'postgres'
    }
  });
}

const connectionInfoPromise = (process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME && process.env.CLOUD_SQL_CONNECTION_NAME)
  ? new Promise({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
  })
  : devPostgres();

const poolPromise = connectionInfoPromise.then(async connectionInfo => {
  const pool = new Pool(connectionInfo);

  await pool.query('SELECT * FROM bar').catch(async error => {
    if (error.message === 'relation "bar" does not exist') {
      console.log('Creating Schema from schema.sql');

      const fs = require('fs');

      const schema = fs.readFileSync('schema.sql', 'utf8');
      await pool.query(schema);
      console.log('Schema created');
    }
  });

  return pool;
});

app.get('/bars', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.query('SELECT * FROM bar');
  res.json(result.rows);
});

app.post('/bars', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.query('INSERT INTO bar(name) VALUES($1)', [req.body.name]);
  res.redirect('/');
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on port ${port}`));
