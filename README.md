# Tío Bigotes

Sistema de gestión de pedidos para la pizzería Tío Bigotes. Stack: React + Vite, Supabase, deploy en Vercel.

Esta fase es solo el esqueleto: la app consulta la tabla `health_check` para verificar la conexión con Supabase.

## Requisitos

- Node.js 20.19+ o 22.12+
- Un proyecto de Supabase con una tabla `health_check` (con, al menos, una columna `status` y una fecha, por ejemplo `created_at`)

## Instalación

```bash
npm install
```

## Variables de entorno

Copiá `.env.example` a `.env` y completá:

| Variable | De dónde sale |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Settings > API > Project API keys > `anon` `public` |

El archivo `.env` está en `.gitignore` y no se sube nunca. En Vercel, cargá las mismas variables en Project Settings > Environment Variables.

## Correr en local

```bash
npm run dev
```

Abrí http://localhost:5173.

## Build

```bash
npm run build
```

El resultado queda en `dist/`.
