Node Bars
---------

# Run Locally
1. docker run --rm -p 5432:5432 postgres
1. docker exec -i postgres psql -U postgres < schema.sql
1. npm run dev
1. http://localhost:5000

# Cloud
1. [![Run on Google Cloud](https://storage.googleapis.com/cloudrun/button.svg)](https://console.cloud.google.com/cloudshell/editor?shellonly=true&cloudshell_image=gcr.io/cloudrun/button&cloudshell_git_repo=https://github.com/jamesward/nodebars)
1. nodebars/.gcloud/setup.sh YOUR_PROJECT YOUR_SERVICE
1. TODO: schema.sql
