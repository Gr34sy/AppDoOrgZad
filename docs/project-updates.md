# Dziennik aktualizacji projektu

Ten plik jest dziennikiem pracy. Trafiają tu szczegółowe opisy zmian,
analizy struktury projektu oraz notatki o kolejnych commitach.

## Analiza struktury projektu

Projekt jest aplikacją `Task Manager` zbudowaną w oparciu o Next.js 14,
TypeScript, Tailwind CSS, MongoDB, Mongoose oraz NextAuth. Aplikacja ma służyć
do zarządzania zadaniami, projektami, checklistami, notatkami oraz przypiętymi
elementami dashboardu.

### Główne katalogi i pliki

- `src/app` - warstwa routingu Next.js App Router. Zawiera strony aplikacji,
  layout globalny oraz endpointy API.
- `src/app/api` - endpointy CRUD i integracyjne. Obsługuje encje `notes`,
  `checklists`, `tasks`, `projects`, `pins`, autoryzację NextAuth oraz endpoint
  `realtime`.
- `src/app/dashboard/page.tsx` - zabezpieczona strona dashboardu. Pobiera sesję
  serwerowo przez `getServerSession`; brak sesji przekierowuje użytkownika do
  `/login`.
- `src/app/login/page.tsx` - strona logowania, powiązana z panelem OAuth.
- `src/components` - komponenty UI podzielone według odpowiedzialności:
  dashboard, layout oraz motywy.
- `src/components/dashboard/pinned-board.tsx` - główna powierzchnia dashboardu
  dla przypiętych elementów.
- `src/components/layout/app-shell.tsx` - szkielet aplikacji po zalogowaniu.
  Aktualnie integruje też przycisk wylogowania.
- `src/components/layout/login-panel.tsx` - panel logowania oparty o dostępnych
  providerów OAuth.
- `src/components/layout/sign-out-button.tsx` - przycisk akcji wylogowania.
- `src/components/theme` - obsługa motywów UI, w tym provider oraz selector.
- `src/lib` - infrastruktura aplikacyjna: konfiguracja NextAuth, połączenie z
  MongoDB/Mongoose, pobieranie aktualnego użytkownika, zapis zdarzeń aktywności
  oraz sanitizacja danych modyfikacji.
- `src/models` - modele Mongoose dla dokumentów domenowych: aktywności,
  checklist, notatek, pinów, projektów, tasków i preferencji użytkownika.
- `src/types` - typy domenowe oraz rozszerzenia typów NextAuth.
- `docs/database-design.md` - szczegółowy opis kolekcji MongoDB, indeksów,
  relacji, statusów i założeń synchronizacji.
- `README.md` - skrócony opis stacku, startu projektu i podstawowej struktury.
- `package.json` - skrypty projektu: `dev`, `build`, `start`, `lint`, `test`,
  `typecheck`.

### Warstwa aplikacji i routingu

Aplikacja używa App Routera. Najważniejsze ścieżki:

- `/` - strona wejściowa aplikacji.
- `/login` - ekran logowania.
- `/dashboard` - widok chroniony; wymaga aktywnej sesji.
- `/api/auth/[...nextauth]` - handler NextAuth.
- `/api/notes` oraz `/api/notes/[noteId]` - lista, tworzenie, odczyt,
  aktualizacja i usuwanie notatek.
- `/api/checklists` oraz `/api/checklists/[checklistId]` - lista, tworzenie,
  odczyt, aktualizacja i usuwanie checklist.
- `/api/tasks` oraz `/api/tasks/[taskId]` - lista, tworzenie, odczyt,
  aktualizacja i usuwanie tasków.
- `/api/projects` oraz `/api/projects/[projectId]` - lista, tworzenie, odczyt,
  aktualizacja i usuwanie projektów.
- `/api/pins` oraz `/api/pins/[pinId]` - lista, tworzenie i usuwanie przypięć.
- `/api/realtime` - endpoint SSE zwracający zdarzenia aktywności użytkownika.

Endpointy domenowe opierają się na aktualnym `ownerId`, co ogranicza dostęp do
danych danego użytkownika. To jest ważny wzorzec bezpieczeństwa w projekcie:
zapytania i mutacje powinny konsekwentnie filtrować dokumenty po właścicielu.

### Autoryzacja i sesja

Autoryzacja jest oparta o NextAuth i adapter MongoDB. Konfiguracja znajduje się
w `src/lib/auth.ts`.

Obecne założenia:

- używana jest strategia sesji `jwt`;
- adapter MongoDB nadal zapisuje użytkowników i konta OAuth;
- aktywne providery OAuth są budowane dynamicznie na podstawie dostępnych
  zmiennych środowiskowych;
- aktualnie obsługiwane są Google oraz GitHub;
- strona logowania jest ustawiona jako `/login`;
- callback `session` dopisuje `session.user.id` na podstawie `token.sub`.

W praktyce oznacza to, że brak konfiguracji danego providera w `.env.local`
nie powinien wywracać całej aplikacji. Provider pojawi się jako dostępny dopiero
wtedy, gdy istnieje komplet `CLIENT_ID` i `CLIENT_SECRET`.

### Model danych

Projekt ma rozbudowaną strukturę dokumentową:

- `UserPreference` - preferencje użytkownika, w tym motyw i układ dashboardu.
- `Note` - notatki z tytułem, treścią, kolorem, tagami, pozycją i archiwizacją.
- `Checklist` - checklisty samodzielne lub przypięte do taska/projektu; zawiera
  zagnieżdżone elementy checklisty.
- `Task` - zadania z priorytetem, statusem Kanbana, terminem, szacowanym czasem,
  tagami, checklistami i archiwizacją.
- `Project` - projekty z priorytetem, statusem cyklu życia, terminem, listami
  tasków/checklist oraz konfigurowalnymi kolumnami Kanbana.
- `Pin` - przypięcia dashboardu wskazujące na `note`, `checklist`, `task` lub
  `project`.
- `ActivityEvent` - log zdarzeń domenowych, używany jako baza do synchronizacji
  i odświeżania danych.

Dokument `docs/database-design.md` opisuje indeksy, relacje i wydajnościowe
założenia projektu. Szczególnie istotne są indeksy po `ownerId`, `position`,
statusie, terminie oraz priorytecie, bo odpowiadają za wydajne listowanie
dashboardu, tasków i projektów użytkownika.

### Synchronizacja i aktywność

`src/lib/activity-events.ts` zapisuje zdarzenia domenowe, a `/api/realtime`
udostępnia ich strumień przez SSE. To sugeruje architekturę, w której CRUD może
w przyszłości natychmiast odświeżać klienta bez pełnego ponownego pobierania
wszystkich kolekcji.

Aktualny model zdarzeń obejmuje akcje:

- `created`
- `updated`
- `deleted`
- `moved`
- `pinned`
- `unpinned`

### UI i motywy

UI jest oparte o Tailwind CSS. Istnieje globalny plik `src/app/globals.css`,
provider motywu oraz selector motywu. Typy domenowe uwzględniają motywy:
`system`, `light`, `dark`, `forest`, `sky`, `rose`.

Layout aplikacji po zalogowaniu jest skupiony w `AppShell`, co daje naturalne
miejsce na nawigację, akcje konta użytkownika i przełączniki globalne.

### Testy i walidacja

Projekt ma skonfigurowany Vitest oraz test jednostkowy dla
`src/lib/sanitize-mutation.ts`. Skrypty walidacyjne:

- `npm run typecheck`
- `npm run lint`
- `npm run test`

Na obecnym etapie testy są punktowe. Największa przestrzeń do rozwoju pokrycia
to endpointy API, logika `ownerId`, obsługa OAuth bez skonfigurowanych providerów
oraz zdarzenia aktywności.

## Historia commitów

### `48ca26e` - `chore: scaffold project structure`

Data: 2026-05-31 13:11:58 +0200

Pierwszy commit tworzy bazową strukturę projektu. Jest to fundament techniczny,
na którym później pojawia się kod aplikacyjny.

Dodane elementy:

- `.env.example` - szablon zmiennych środowiskowych potrzebnych do uruchomienia
  aplikacji.
- `.eslintrc.json` - podstawowa konfiguracja ESLint dla projektu Next.js.
- `.gitignore` - ignorowanie zależności, buildów, plików środowiskowych,
  logów i lokalnych artefaktów.
- `README.md` - opis aplikacji, stacku, instrukcji startu, struktury i komend
  walidacyjnych.
- `next-env.d.ts`, `next.config.mjs` - podstawowa konfiguracja Next.js.
- `package.json`, `package-lock.json` - definicja projektu Node, zależności i
  skryptów.
- `postcss.config.mjs`, `tailwind.config.ts` - konfiguracja Tailwind/PostCSS.
- `tsconfig.json` - konfiguracja TypeScript.
- `vitest.config.ts` - konfiguracja testów jednostkowych.

Znaczenie commita:

- ustanawia stack: Next.js, React, TypeScript, Tailwind CSS, MongoDB, Mongoose,
  NextAuth i Vitest;
- przygotowuje repo do pracy lokalnej przez `npm install`, `npm run dev`,
  `npm run typecheck`, `npm run lint`, `npm run test`;
- nie zawiera jeszcze właściwej logiki domenowej, ale tworzy ramę pod dalszą
  implementację.

Ryzyka lub uwagi:

- `.env.example` z tego commita był tylko punktem startowym i został później
  zmieniony przy konfiguracji OAuth;
- większość kodu funkcjonalnego pojawia się dopiero w następnym commicie.

### `f82057d` - `feat: add database design and task management code`

Data: 2026-05-31 13:12:30 +0200

Największy dotychczasowy commit. Dodaje główną warstwę domenową, API, modele,
podstawowy interfejs, dokumentację bazy danych, autoryzację oraz mechanizmy
pomocnicze.

Dodane obszary:

- dokumentacja bazy danych w `docs/database-design.md`;
- routing Next.js w `src/app`, w tym layout, strona logowania, dashboard i
  przekierowanie ze strony głównej;
- endpoint NextAuth w `src/app/api/auth/[...nextauth]/route.ts`;
- endpointy CRUD dla notatek, checklist, tasków, projektów i pinów;
- endpoint `/api/realtime` dla zdarzeń aktywności;
- komponenty UI: `PinnedBoard`, `AppShell`, `LoginPanel`, `ThemeProvider`,
  `ThemeSelector`;
- biblioteki infrastrukturalne: `auth`, `mongodb-client`, `mongoose`,
  `session`, `sanitize-mutation`, `activity-events`;
- modele Mongoose dla wszystkich głównych encji;
- typy domenowe i rozszerzenie typu sesji NextAuth;
- test jednostkowy sanitizacji mutacji.

Najważniejsze zmiany funkcjonalne:

- użytkownik może korzystać z chronionego dashboardu po zalogowaniu;
- aplikacja ma podstawę do tworzenia, pobierania, aktualizowania i usuwania
  głównych encji domenowych;
- dane są powiązane z właścicielem przez `ownerId`;
- modele wspierają miękką archiwizację przez `archivedAt`;
- projekty mają konfigurowalne kolumny Kanbana;
- taski mogą mieć priorytety, statusy, terminy, szacowany czas i checklisty;
- dashboard może opierać się na przypiętych elementach;
- zdarzenia aktywności dają podstawę do realtime/SSE.

Znaczenie architektoniczne:

- commit definiuje główną domenę aplikacji;
- przenosi projekt z etapu scaffoldu do działającego szkieletu produktu;
- tworzy spójny wzorzec dla endpointów: pobierz użytkownika, połącz z bazą,
  wykonaj operację po `ownerId`, zwróć JSON;
- rozdziela odpowiedzialności między API, modele, typy, komponenty i helpery.

Ryzyka lub uwagi:

- commit jest bardzo szeroki, więc potencjalne regresje mogą dotyczyć wielu
  warstw naraz;
- testy obejmują tylko sanitizację mutacji, a nie pełne przepływy API;
- warto w przyszłości dodać testy autoryzacji dostępu po `ownerId`, szczególnie
  dla `GET`, `PATCH` i `DELETE` pojedynczych dokumentów;
- endpoint realtime jest bazą pod synchronizację, ale wymaga dalszej weryfikacji
  zachowania pod obciążeniem i przy wielu klientach.

### `f1af882` - `feat: configure google and github oauth`

Data: 2026-05-31 19:56:48 +0200

Commit dopracowuje konfigurację OAuth i ekran logowania. Zmienia sposób
definiowania providerów, tak aby Google i GitHub były obsługiwane dynamicznie
na podstawie dostępnych zmiennych środowiskowych.

Zmodyfikowane pliki:

- `.env.example`
- `src/app/login/page.tsx`
- `src/components/layout/login-panel.tsx`
- `src/lib/auth.ts`

Najważniejsze zmiany funkcjonalne:

- konfiguracja OAuth została ograniczona do Google i GitHub;
- `src/lib/auth.ts` tworzy listę providerów z konfiguracji i filtruje tylko te,
  które mają komplet danych;
- eksport `enabledOAuthProviders` pozwala UI wiedzieć, które metody logowania
  faktycznie są dostępne;
- `LoginPanel` może wyświetlać przyciski logowania zależnie od aktywnych
  providerów, zamiast zakładać stałą listę;
- strona logowania została dopasowana do nowej konfiguracji.

Znaczenie architektoniczne:

- aplikacja staje się odporniejsza na częściową konfigurację `.env.local`;
- środowisko developerskie nie musi mieć wszystkich providerów naraz;
- UI logowania i konfiguracja NextAuth korzystają z jednego źródła prawdy.

Ryzyka lub uwagi:

- `allowDangerousEmailAccountLinking: true` ułatwia łączenie kont po e-mailu,
  ale jest ustawieniem, które warto świadomie zaakceptować w kontekście
  bezpieczeństwa;
- jeśli żaden provider nie ma kompletu zmiennych środowiskowych, ekran logowania
  powinien jasno obsługiwać brak dostępnych metod logowania;
- README nadal wspomina Facebooka jako element stacku, podczas gdy aktualna
  konfiguracja w `auth.ts` obejmuje Google i GitHub.

### `fad9cf1` - `feat: add sign out action`

Data: 2026-05-31 19:57:02 +0200

Commit dodaje możliwość wylogowania z aplikacji.

Zmodyfikowane lub dodane pliki:

- `src/components/layout/app-shell.tsx`
- `src/components/layout/sign-out-button.tsx`

Najważniejsze zmiany funkcjonalne:

- dodano komponent `SignOutButton`;
- `AppShell` renderuje akcję wylogowania w layoucie aplikacji;
- użytkownik po zalogowaniu ma dostępną podstawową akcję zakończenia sesji.

Znaczenie architektoniczne:

- akcja konta użytkownika została umieszczona w komponencie layoutu, czyli w
  miejscu dostępnym dla widoków chronionych;
- wylogowanie jest osobnym komponentem, więc można je łatwo przenieść, ostylować
  lub rozbudować bez modyfikowania logiki dashboardu.

Ryzyka lub uwagi:

- warto sprawdzić, czy redirect po wylogowaniu prowadzi użytkownika w oczekiwane
  miejsce;
- w przyszłości przy rozbudowie nawigacji dobrze będzie utrzymać akcje konta
  użytkownika w jednym, spójnym obszarze `AppShell`.

### Planowany commit - `docs: add project update log`

Data wpisu: 2026-06-03 12:51:26 +0200

Cel:

- dodać do repozytorium lokalny dziennik aktualizacji projektu w katalogu
  `docs`;
- uzupełnić go o analizę struktury projektu oraz szczegółowe opisy commitów,
  które powstały do tej pory;
- uporządkować dokumentację bazy danych po bieżących ustaleniach dotyczących
  OAuth i widocznych kolekcji NextAuth.

Zmodyfikowane lub dodane pliki:

- `docs/project-updates.md`
- `docs/database-design.md`

Opis zmian:

- `docs/project-updates.md` opisuje strukturę projektu, odpowiedzialności
  katalogów, główne endpointy, modele danych, autoryzację, realtime, UI, testy
  oraz historię dotychczasowych commitów;
- `docs/database-design.md` usuwa wzmiankę o Facebooku z listy powiązanych kont
  OAuth, ponieważ aktualna konfiguracja aplikacji obsługuje Google i GitHub;
- tabele w `docs/database-design.md` zostały wyrównane formatowaniem Markdown,
  co poprawia czytelność dokumentu bez zmiany jego znaczenia domenowego.

Wpływ na użytkownika:

- zmiana nie wpływa bezpośrednio na działanie aplikacji;
- dokumentacja staje się dokładniejsza i łatwiejsza do używania przy dalszym
  rozwoju projektu;
- dziennik aktualizacji daje jedno miejsce do śledzenia, co zmieniają kolejne
  commity.

Testy:

- nie uruchamiano testów automatycznych, ponieważ zmiany dotyczą wyłącznie
  dokumentacji.

Ryzyka lub uwagi:

- przy kolejnych commitach warto aktualizować ten plik na bieżąco, najlepiej
  przed wykonaniem commita;
- jeśli nazwa bazy danych zostanie zmieniona z domyślnej `test`, należy
  odnotować to w dokumentacji bazy i konfiguracji środowiskowej.
