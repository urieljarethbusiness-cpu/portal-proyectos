# Portal de Proyectos

Aplicación web para gestión operativa de proyectos con enfoque en freelancers y servicios recurrentes: seguimiento de estado, tareas, notas, archivos, pagos e indicadores financieros.

## Características principales

- Dashboard general con métricas de proyectos/tareas, ingresos proyectados y alertas por SLA.
- Gestión de proyectos (kanban/listado), detalle por proyecto y configuración editable.
- Gestión de tareas por proyecto y vista global de tareas.
- Gestión financiera: pagos/hitos, costos extra, saldo pendiente y resumen financiero global.
- Gestión de archivos por proyecto:
  - Carga y registro de archivos.
  - Descarga de archivos individuales.
  - Descarga ZIP por proyecto.
  - Inventario de archivos residuales (en disco sin registro en BD) con acciones de vincular/eliminar.
- Notas por proyecto.

## Stack tecnológico

- Next.js 16 (App Router, Server Components, Route Handlers).
- React 19 + TypeScript.
- Prisma ORM + PostgreSQL.
- CSS Modules.
- Librerías UI/UX: lucide-react, framer-motion, recharts.
- Contenerización: Docker multi-stage + despliegue con Coolify.

## Requisitos previos

- Node.js 20+ (recomendado por Dockerfile).
- pnpm (el proyecto incluye `pnpm-lock.yaml`; también puede ejecutarse con npm, pero el flujo principal usa pnpm).
- Base de datos PostgreSQL accesible desde `DATABASE_URL`.

## Variables de entorno

> **No subas secretos al repositorio.** Usa `.env` local y variables seguras en tu plataforma de despliegue.

Variables detectadas:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB"
COOLIFY_API_URL="https://coolify.tu-dominio.com/api/v1"
COOLIFY_API_TOKEN="tu_token"
```

Notas:
- `DATABASE_URL` es obligatoria para Prisma.
- `COOLIFY_API_URL` y `COOLIFY_API_TOKEN` existen en `.env`, pero no se observó uso directo en el código de aplicación actual.

## Instalación y ejecución local

1. Instalar dependencias:

```bash
pnpm install
```

2. Configurar `.env` con una base PostgreSQL válida.

3. Generar cliente Prisma (si no se generó automáticamente):

```bash
pnpm run gen
```

4. Iniciar entorno de desarrollo:

```bash
pnpm dev
```

5. Abrir `http://localhost:3000`.

### Scripts disponibles

- `pnpm dev` → inicia Next.js en desarrollo.
- `pnpm build` → build de producción.
- `pnpm start` → servidor de producción.
- `pnpm lint` → lint con ESLint.
- `pnpm run gen` → `prisma generate`.

## Flujo de base de datos (Prisma)

El esquema está en `prisma/schema.prisma` y usa PostgreSQL.

Comandos útiles:

```bash
pnpm run gen
```

Para migraciones/seed:
- Actualmente **no** hay scripts `migrate` ni `seed` definidos en `package.json`.
- Tampoco hay endpoint/archivo de seed implementado en `src/app/api/seed`.

Si necesitas migrar en local, usa Prisma CLI de forma explícita (por ejemplo `pnpm prisma migrate dev`) y define esos scripts antes de documentarlos como flujo oficial.

## Estructura funcional (rutas clave)

- `/` → dashboard general.
- `/proyectos` → navegador/listado de proyectos.
- `/proyectos/[id]` → detalle de proyecto (tareas, notas, finanzas, archivos, configuración).
- `/tareas` → vista global de tareas por proyecto.
- `/finanzas` → resumen financiero y tabla de pagos/hitos.
- `/archivos` → repositorio de archivos + residuales.

Rutas API relevantes:
- `/api/files/[projectId]/[filename]` → descarga de archivo.
- `/api/files/[projectId]/download-zip` → descarga ZIP de archivos del proyecto o carpeta residual.

## Módulos internos relevantes

- `src/lib/actions.ts` → acciones de servidor (CRUD de proyectos, tareas, notas, pagos, extras, archivos).
- `src/lib/file-inventory.ts` → detección/gestión de archivos residuales en `storage/projects`.
- `src/lib/prisma.ts` → instancia singleton de Prisma Client (con protección para hot reload en desarrollo).

## Despliegue

### Docker

El proyecto incluye `Dockerfile` multi-stage para producción con `next build` y salida standalone (`next.config.ts` define `output: 'standalone'`).

Comandos típicos:

```bash
docker build -t portal-proyectos .
docker run --rm -p 3000:3000 --env-file .env portal-proyectos
```

### Coolify

`coolify.yaml` define:
- build usando `Dockerfile` del repositorio,
- variables (`DATABASE_URL`, `NODE_ENV`, `PORT`, etc.),
- puerto `3000:3000`,
- volumen persistente `app_storage` montado en `/app/storage`,
- healthcheck HTTP a `http://127.0.0.1:3000/`.

#### Coolify deployment

Variables requeridas en Coolify:
- `DATABASE_URL` (obligatoria para Prisma y migraciones).
- `NODE_ENV=production`.
- `PORT=3000`.

Orden recomendado de despliegue (alineado con scripts):

```bash
pnpm run build
pnpm run migrate:deploy
pnpm run start
```

También puedes usar el script unificado:

```bash
pnpm run deploy
```

## Troubleshooting

- **Error de conexión a BD / Prisma**
  - Verifica `DATABASE_URL` y conectividad de PostgreSQL.
  - Regenera cliente con `pnpm run gen`.

- **Cambiaste modelos Prisma y faltan propiedades en runtime**
  - Regenera cliente Prisma; la app usa cliente generado en `src/generated/client`.

- **Archivos no aparecen o hay “residuales”**
  - Revisa permisos y persistencia de `storage/projects`.
  - En contenedor, confirma volumen en `/app/storage`.

- **Fallo al construir imagen con lockfile**
  - El `Dockerfile` usa pnpm con lockfile; mantén `pnpm-lock.yaml` actualizado y consistente.
