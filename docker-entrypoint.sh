#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: La variable de entorno DATABASE_URL no está configurada."
  echo "       Configúrala en Coolify (o en tu docker-compose) antes de desplegar."
  exit 1
fi

echo "Aplicando migraciones de base de datos..."
prisma migrate deploy

echo "Preparando almacenamiento persistente..."
mkdir -p /app/storage/projects

echo "Iniciando servidor Next.js..."
exec node server.js
