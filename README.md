Node Bars
---------

# Run Locally
1. `docker run --rm --name postgres -p 5432:5432 postgres`
1. `docker exec -i postgres psql -U postgres < schema.sql`
1. `npm run dev`
1. Open the app: [http://localhost:5000](http://localhost:5000)

# Cloud Run
[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)
