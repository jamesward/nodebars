#!/bin/bash

declare project=$GCP_PROJECT
declare service=$K_SERVICE
declare region=$GCP_REGION

gcloud services enable sqladmin.googleapis.com --project=$project

declare db_user=postgres
declare db_pass=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
declare db_name=postgres

gcloud sql instances describe $service --project=$project &> /dev/null

echo "Creating Cloud SQL instance for $service"
gcloud sql instances create $service --database-version=POSTGRES_9_6 --tier=db-f1-micro --region=$region --project=$project --root-password=$db_pass

gcloud beta run services update $service \
  --add-cloudsql-instances=$service \
  --set-env-vars=DB_USER=$db_user,DB_PASS=$db_pass,DB_NAME=$db_name,CLOUD_SQL_CONNECTION_NAME=$project:$region:$service \
  --platform=managed --project=$project --region=$region

wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy
./cloud_sql_proxy -instances=$project:$region:$service=tcp:5432 &
sleep 30
PGPASSWORD=$db_pass psql -h localhost -U $db_user < schema.sql
