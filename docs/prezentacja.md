# Prezentacja projektu - aktualny zakres aplikacji

## Slajd 1 - Cel i zakres prezentowanej części

Treść slajdu:

- Aplikacja do organizacji pracy: notatki, zadania, checklisty, projekty i dashboard.
- Prezentowany zakres: logowanie OAuth, sesja JWT, customizacja UI, model MongoDB/Mongoose, CRUD i API notatek.
- Stack: Next.js 14, TypeScript, Tailwind CSS, NextAuth, MongoDB, Mongoose.

Notatki do omówienia:

- Podkreśl, że prezentowana część obejmuje zarówno frontend, jak i backend aplikacji.
- Warto powiedzieć, że aplikacja jest budowana modułowo: osobne modele, endpointy API, komponenty UI i warstwa sesji.
- Dobry punkt startowy: "Chcę pokazać fragment aplikacji od logowania użytkownika, przez zapis danych w MongoDB, po operacje CRUD na notatkach i personalizację interfejsu".

## Slajd 2 - Architektura aplikacji

Treść slajdu:

- Next.js App Router jako warstwa stron i endpointów API.
- `AppShell` jako wspólny layout po zalogowaniu.
- `src/app/api` jako backend aplikacji.
- `src/models` jako modele Mongoose.
- `src/lib` jako infrastruktura: auth, sesja, baza, sanitizacja, zdarzenia.

Notatki do omówienia:

- Wyjaśnij przepływ: użytkownik loguje się przez OAuth, NextAuth tworzy sesję JWT, strony i endpointy sprawdzają `session.user.id`, a dane są filtrowane po `ownerId`.
- Wspomnij, że App Router pozwala trzymać strony i API w jednym projekcie bez oddzielnego backendu.
- Warto pokazać katalogi: `src/lib/auth.ts`, `src/lib/session.ts`, `src/app/api/notes`, `src/models/note.ts`.

## Slajd 3 - OAuth przez NextAuth

Treść slajdu:

- Logowanie przez Google i GitHub.
- NextAuth z adapterem MongoDB.
- Providery są włączane tylko wtedy, gdy istnieją zmienne środowiskowe.
- Własna strona logowania: `/login`.

Notatki do omówienia:

- Konfiguracja znajduje się w `src/lib/auth.ts`.
- Aplikacja używa `GoogleProvider` i `GitHubProvider`.
- Lista aktywnych providerów jest budowana dynamicznie, więc brak konfiguracji jednego OAuth providera nie blokuje działania całej aplikacji.
- Adapter MongoDB zapisuje użytkowników i powiązane konta OAuth w kolekcjach NextAuth, np. `users` i `accounts`.
- Możesz powiedzieć: "Nie trzymam haseł użytkowników w aplikacji, deleguję uwierzytelnianie do zaufanych providerów OAuth".

## Slajd 4 - Zarządzanie sesją JWT

Treść slajdu:

- Strategia sesji: `jwt`.
- `session.user.id` pochodzi z `token.sub`.
- Dostęp do chronionych stron przez `getServerSession`.
- Endpointy API korzystają z `getCurrentUserId()`.

Notatki do omówienia:

- W `authOptions` ustawione jest `session: { strategy: "jwt" }`.
- Callback `session` dopisuje `session.user.id`, dzięki czemu backend może jednoznacznie filtrować dane użytkownika.
- Helper `getCurrentUserId()` w `src/lib/session.ts` centralizuje pobieranie zalogowanego użytkownika.
- Gdy użytkownik nie ma sesji, strony robią `redirect("/login")`, a API zwraca `401 Unauthorized`.
- Warto podkreślić zasadę bezpieczeństwa: każda operacja domenowa jest powiązana z `ownerId`.

## Slajd 5 - Model bazy danych Mongoose

Treść slajdu:

- MongoDB jako baza dokumentowa.
- Mongoose do schematów, walidacji, indeksów i relacji przez `ObjectId`.
- Główne kolekcje: `notes`, `tasks`, `checklists`, `projects`, `pins`, `userpreferences`, `activityevents`.
- Soft delete przez `archivedAt`.

Notatki do omówienia:

- Pokaż `src/models/note.ts` jako najprostszy przykład modelu.
- Notatka ma `ownerId`, `title`, `content`, `color`, `tags`, `position`, `archivedAt` oraz timestampy.
- Indeks `{ ownerId: 1, position: 1 }` pomaga sortować notatki użytkownika.
- Soft delete oznacza, że usunięcie ustawia `archivedAt`, zamiast fizycznie usuwać dokument od razu.
- Szerszy opis kolekcji znajduje się w `docs/database-design.md`.

## Slajd 6 - Model preferencji i customizacja strony

Treść slajdu:

- `colorMode`: ogólny tryb aplikacji, czyli `light`, `dark` albo `system`.
- `colors`: kolory akcentu, kalendarza i kafelków dashboardu.
- `savedThemes`: zapisane własne motywy użytkownika.
- Zmienne CSS sterujące UI: `--app-background`, `--app-accent`, `--dashboard-*`.

Notatki do omówienia:

- To jest przykład rozdzielenia odpowiedzialności: color mode odpowiada za tło i bazową jasność UI, a color theme za akcenty i dashboard.
- Dane są zapisywane w `UserPreference`, endpoint znajduje się w `/api/user-preferences`.
- Frontendowy provider `ThemeProvider` aplikuje zmienne CSS na `document.documentElement`.
- Tryb `system` reaguje na `prefers-color-scheme`, czyli ustawienia systemu operacyjnego użytkownika.
- Warto pokazać stronę `/dashboard/settings`.

## Slajd 7 - Dashboard i przypięte elementy

Treść slajdu:

- Dashboard agreguje najważniejsze informacje.
- Pinned items obsługują notatki, checklisty, taski i projekty.
- Wyszukiwarka i filtry działają lokalnie po przypiętych elementach.
- Kafelki dashboardu korzystają z kolorów wybranych w ustawieniach.
- `AppShell` nasłuchuje zdarzeń realtime i odświeża dane po zmianach.

Notatki do omówienia:

- Ten fragment dobrze pokazuje praktyczną customizację UI.
- Warto powiedzieć, że dashboard nie jest osobną encją, tylko widokiem agregującym dane z wielu kolekcji.
- Przypięcia są osobną kolekcją `pins`, która wskazuje na typ i ID elementu.
- Filtr "all/notes/checklists/tasks/projects" nie tworzy elementów, tylko zmienia widoczny zbiór przypiętych rzeczy.
- Klient używa `EventSource` przez komponent `RealtimeRefresh`, a endpoint `/api/realtime` streamuje zdarzenia z `activityevents`.

## Slajd 8 - API i CRUD do notatek

Treść slajdu:

- `GET /api/notes` - lista notatek użytkownika.
- `POST /api/notes` - tworzenie notatki.
- `GET /api/notes/[noteId]` - szczegóły notatki.
- `PATCH /api/notes/[noteId]` - aktualizacja.
- `DELETE /api/notes/[noteId]` - soft delete.

Notatki do omówienia:

- Endpointy są w `src/app/api/notes`.
- Każdy endpoint sprawdza sesję i używa `ownerId`, żeby użytkownik nie dostał cudzych danych.
- `PATCH` i `DELETE` dodatkowo sprawdzają poprawność `noteId` przez `isValidObjectId`.
- Tworzenie i aktualizacja przechodzą przez `sanitizeNoteMutation`, dzięki czemu klient nie może nadpisać pól typu `ownerId`, `_id`, `createdAt`.
- Po operacjach zapisywane są zdarzenia aktywności przez `recordActivityEvent`.

## Slajd 9 - Walidacja, sanitizacja i bezpieczeństwo API

Treść slajdu:

- Usuwanie pól niedozwolonych z payloadu.
- Walidacja requestów przez schematy Zod.
- Rate limiting dla mutacji notatek i preferencji.
- Obsługa błędnego JSON jako `400 Bad Request`.
- Odpowiedzi `401` dla braku sesji i `404` dla braku zasobu.

Notatki do omówienia:

- Schematy Zod w `src/lib/validation-schemas.ts` walidują kształt requestów przed zapisem w bazie.
- `sanitizeMutation` usuwa pola, których klient nie powinien kontrolować.
- `sanitizeNoteMutation` przepuszcza tylko edytowalne pola notatki i normalizuje kolory.
- Dodatkowy helper `readJsonBody` zabezpiecza API przed błędnym lub pustym body.
- `checkRateLimit` ogranicza liczbę operacji mutujących per użytkownik i okno czasowe.
- To jest dobry przykład "defense in depth": walidacja jest po stronie UI, ale backend i tak broni własnego kontraktu.
- Testy jednostkowe dla sanitizacji są w `src/lib/note-mutations.test.ts` i `src/lib/sanitize-mutation.test.ts`.
- Testy integracyjne route handlerów notatek są w `src/app/api/notes/route.test.ts` i `src/app/api/notes/[noteId]/route.test.ts`.

## Slajd 10 - UI notatek

Treść slajdu:

- Lista notatek z wyszukiwarką, filtrem tagów i sortowaniem.
- Tworzenie i edycja notatki z kolorami, tagami i walidacją.
- Szczegóły notatki z akcjami: edit, pin, delete.
- Kolory notatek normalizowane do HEX.

Notatki do omówienia:

- UI notatek jest zrobione jako osobny obszar domenowy w `src/components/notes`.
- Karty notatek używają helpera `getNoteCardStyle`, który dobiera czytelny kolor tekstu do tła.
- Kolory można wybrać przez swatche albo custom HEX.
- Lista notatek jest połączona z parametrami URL: search, tag i sort.

## Slajd 11 - Jakość kodu i dobre praktyki

Treść slajdu:

- Separacja domeny, infrastruktury i komponentów UI.
- Typy domenowe w `src/types/domain.ts`.
- Wspólne helpery: sesja, połączenie z DB, sanitizacja, parser JSON, rate limiter.
- TypeScript, testy jednostkowe i testy integracyjne API.

Notatki do omówienia:

- W ramach przeglądu przeniesiono typ `ColorSettings` do typów domenowych, żeby API nie zależało od client componentu.
- Endpointy notatek dostały walidację Zod, obsługę pustych/błędnych payloadów i rate limiting.
- Endpoint preferencji migruje legacy `theme` do `colorMode` i usuwa stare pole z dokumentu.
- Dokumentacja bazy danych została zaktualizowana po rozdzieleniu `colorMode` i `colors`.
- Weryfikacja techniczna: `npm run typecheck`, `npm run test` i `npm run lint`.

## Slajd 12 - Co warto dodać dalej

Treść slajdu:

- Testy end-to-end najważniejszych flow użytkownika.
- Dokładniejszy audyt bezpieczeństwa i konfiguracji OAuth.
- Trwały rate limiting oparty o Redis lub bazę, gotowy pod wiele instancji.
- Lepsza observability: logi błędów, metryki i monitoring requestów.
- Aktualizacja zależności Next.js/NextAuth po analizie breaking changes.

Notatki do omówienia:

- Aktualny kod ma testy jednostkowe i integracyjne route handlerów API notatek.
- Zod, rate limiting i migracja legacy `theme` są już wdrożone w bieżącej wersji.
- Obecny rate limiting jest prosty i pamięciowy, dobry do ochrony podstawowej i prezentacji architektury; produkcyjnie warto przenieść go do trwałego storage.
- Endpoint `/api/realtime`, `activityevents` i `RealtimeRefresh` tworzą działające aktywne odświeżanie widoków.
- Testy e2e mogłyby automatycznie sprawdzać demo: login, settings, tworzenie notatki i przypięcie na dashboard.
- `npm audit` wskazuje podatności w aktualnym drzewie Next.js/NextAuth, ale automatyczna poprawka wymaga breaking changes, więc najlepiej zaplanować kontrolowany upgrade.

## Slajd 13 - Demo podczas rozmowy

Treść slajdu:

- Logowanie przez OAuth.
- Zmiana color mode i color theme w Settings.
- Utworzenie notatki z kolorem i tagami.
- Wyszukanie notatki na liście.
- Przypięcie notatki do dashboardu.

Notatki do omówienia:

- Najlepsza kolejność demo: login, settings, notes, dashboard.
- Podczas logowania wspomnij o NextAuth i JWT.
- Podczas ustawień pokaż rozdzielenie color mode i color theme.
- Podczas notatek pokaż pełny CRUD: create, read, update, delete.
- Podczas dashboardu pokaż, że notatka może stać się częścią widoku agregującego.

## Slajd 14 - Podsumowanie

Treść slajdu:

- Aplikacja ma działający przepływ od OAuth do danych użytkownika.
- Dane są izolowane przez `ownerId`.
- Notatki mają pełny CRUD i UI.
- Customizacja jest zapisywana per użytkownik.
- Kod jest przygotowany do dalszego rozwoju.

Notatki do omówienia:

- Podkreśl, że projekt nie jest tylko makietą UI: ma realne endpointy, modele, sesję i zapis w bazie.
- Dobrze brzmi końcowe zdanie: "Najważniejsze było dla mnie połączenie użytecznego interfejsu z poprawną separacją danych użytkowników i czystą strukturą backendu".
- Na pytanie o dalszy rozwój wróć do slajdu z testami integracyjnymi, walidacją requestów i realtime.

## Checklista zgodności z wymaganymi tematami

- OAuth: zaimplementowany przez NextAuth, Google i GitHub, adapter MongoDB.
- Zarządzanie sesją JWT: `session.strategy = "jwt"`, `session.user.id` z `token.sub`, helper `getCurrentUserId`.
- Customizacja strony: `ColorThemeSettings`, `ThemeProvider`, `UserPreference`, zmienne CSS i zapis custom themes.
- Model bazy danych Mongoose: modele w `src/models`, dokumentacja w `docs/database-design.md`.
- CRUD i API do notatek: endpointy `/api/notes` i `/api/notes/[noteId]`, UI w `/dashboard/notes`.
- Walidacja i ochrona API: Zod, sanitizacja, rate limiting oraz testy integracyjne endpointów notatek.
- Realtime: `activityevents`, `/api/realtime` oraz klient `RealtimeRefresh` odświeżający widoki.

## Uwagi po przeglądzie aplikacji

- Aplikacja posiada wszystkie elementy potrzebne do omówienia wskazanych zagadnień.
- Wprowadzone usprawnienia przed prezentacją:
  - przeniesienie typu `ColorSettings` do `src/types/domain.ts`;
  - bezpieczne parsowanie JSON w API przez `readJsonBody`;
  - walidacja requestów przez Zod;
  - rate limiting endpointów mutujących;
  - testy integracyjne API notatek;
  - migracja usuwająca legacy pole `theme`;
  - aktywne odświeżanie UI przez SSE;
  - aktualizacja dokumentacji `docs/database-design.md`.
- Potencjalne usprawnienia na kolejne etapy:
  - testy end-to-end flow użytkownika;
  - trwały rate limiting dla środowiska wieloinstancyjnego;
  - lepsza obsługa komunikatów błędów w formularzach ustawień;
  - audyt bezpieczeństwa OAuth i endpointów mutujących;
  - monitoring oraz logowanie błędów aplikacji;
  - kontrolowany upgrade Next.js i NextAuth po sprawdzeniu breaking changes.
