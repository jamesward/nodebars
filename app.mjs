import express from 'express';
import PG from 'pg';
import bodyParser from 'body-parser';

const app = express();

async function devPostgres() {
  console.log('Starting Postgres');

  const TestContainers = await import('testcontainers');

  const pgPassword = Math.random().toString(36).substring(2);

  const container = await new TestContainers.default.GenericContainer('postgres')
    .withExposedPorts(5432)
    .withTmpFs({'/temp_pgdata': 'rw,noexec,nosuid,size=65536k'})
    .withEnv('POSTGRES_PASSWORD', pgPassword)
    .start();

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
    host: container.getHost(),
    port: container.getMappedPort(5432),
    user: 'postgres',
    password: pgPassword,
    database: 'postgres'
  }
}

async function getConnectionInfo() {
  if (process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME && process.env.CLOUD_SQL_CONNECTION_NAME) {
    return {
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
    };
  }
  else if (process.env.NODE_ENV === 'production') {
    app.get('/', (req, res) => res.send("App Needs Setup"));
    return null;
  }
  else {
    return await devPostgres();
  }
}

async function getPool() {
  const pool = new PG.Pool(await getConnectionInfo());

  await pool.query('SELECT * FROM bar').catch(async error => {
    if (error.message === 'relation "bar" does not exist') {
      console.log('Creating Schema from schema.sql');

      const fs = await import('fs');

      const schema = fs.readFileSync('schema.sql', 'utf8');
      await pool.query(schema);
      console.log('Schema created');
    }
  });

  return pool;
}

const pool = await getPool();

// order is important because non-setup apps needs to register a get / handler before these run
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.enable('trust proxy');

app.get('/bars', async (req, res) => {
  const result = await pool.query('SELECT * FROM bar');
  res.json(result.rows);
});

app.post('/bars', async (req, res) => {
  const result = await pool.query('INSERT INTO bar(name) VALUES($1)', [req.body.name]);
  res.redirect('/');
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on port ${port}`));
