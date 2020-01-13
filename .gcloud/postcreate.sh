#!/bin/bash

declare project=$GCP_PROJECT
declare service=$K_SERVICE
declare region=$GCP_REGION

gcloud services enable sqladmin.googleapis.com --project=$project

declare db_user=postgres
declare db_pass=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
declare db_name=postgres

# Once an instance is created with a name, you can never create another with the same name, even after it is deleted.
# So we pick a random 8 numbers to append to the instance name.
declare instance="$service-$(cat /dev/urandom | tr -dc '0-9' | fold -w 8 | head -n 1)"

echo "Creating Cloud SQL instance named $instance"
gcloud sql instances create $instance --database-version=POSTGRES_9_6 --tier=db-f1-micro --region=$region --project=$project --root-password=$db_pass

gcloud beta run services update $service \
  --add-cloudsql-instances=$instance \
  --set-env-vars=DB_USER=$db_user,DB_PASS=$db_pass,DB_NAME=$db_name,CLOUD_SQL_CONNECTION_NAME=$project:$region:$instance \
  --platform=managed --project=$project --region=$region

wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy

echo "downloaded"

chmod +x cloud_sql_proxy
./cloud_sql_proxy -instances=$project:$region:$instance=tcp:5432 &
sleep 30
PGPASSWORD=$db_pass psql -h localhost -U $db_user < schema.sql
