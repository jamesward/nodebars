#!/bin/bash

declare project=$1
declare service=$2

if [ "$project" == "" ] || [ "$service" == "" ]; then
  echo "Must set arguments: setup.sh PROJECT SERVICE"
  exit 1
fi

declare region=$(gcloud beta run services list --platform=managed --project=$project --filter="metadata.name=$service" --format="get(metadata.labels['cloud.googleapis.com/location'])")

gcloud services enable sqladmin.googleapis.com --project=$project

declare db_user=postgres
declare db_pass=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
declare db_name=postgres

gcloud sql instances describe $service --project=$project &> /dev/null

if [ $? -ne 0 ]; then
  echo "Creating Cloud SQL instance for $service"
  gcloud sql instances create $service --database-version=POSTGRES_9_6 --tier=db-f1-micro --region=$region --project=$project --root-password=$db_pass
else
  gcloud sql users set-password $db_user --instance=$service --password=$db_pass --project=$project
fi

# IAM
#cloudsql.instances.connect

gcloud beta run services update $service \
  --add-cloudsql-instances=$service \
  --set-env-vars=DB_USER=$db_user,DB_PASS=$db_pass,DB_NAME=$db_name,CLOUD_SQL_CONNECTION_NAME=$service \
  --platform=managed --project=$project --region=$region
