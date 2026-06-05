# Task Manager

Aplikacja do zarządzania zadaniami, notatkami, checklistami i projektami.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- MongoDB
- NextAuth OAuth: Google, GitHub
- Vitest for unit tests

## Start

1. Zainstaluj zależności:

```bash
npm install
```

2. Skopiuj `.env.example` do `.env.local` i uzupełnij wartości OAuth oraz `MONGODB_URI`.

3. Uruchom projekt:

```bash
npm run dev
```

## Struktura

- `src/app` - routing Next.js App Router
- `src/components` - komponenty UI
- `src/lib` - konfiguracja auth i połączeń
- `src/models` - modele MongoDB/Mongoose
- `src/types` - typy domenowe
- `src/app/api` - endpointy CRUD dla głównych encji
- `docs/database-design.md` - projekt bazy danych

## Testy i walidacja

```bash
npm run typecheck
npm run lint
npm run test
```
