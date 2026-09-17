# Powtorka kodu przed obrona

Ten plik sluzy do powtorzenia rzeczy technicznych zwiazanych z kodem aplikacji. Warto umiec opowiedziec nie tylko co aplikacja robi, ale tez jak dana funkcja zostala zaimplementowana, gdzie znajduje sie kod i dlaczego wybrano takie rozwiazanie.

## 1. Ogolna struktura projektu

Aplikacja zostala napisana w Next.js z App Routerem. Oznacza to, ze w jednym projekcie znajduja sie widoki frontendu oraz endpointy backendowe.

Najwazniejsze katalogi:

- `src/app` - strony aplikacji oraz routing Next.js.
- `src/app/api` - backendowe Route Handlers, czyli endpointy API.
- `src/components` - komponenty interfejsu uzytkownika.
- `src/models` - modele Mongoose opisujace dokumenty MongoDB.
- `src/lib` - funkcje pomocnicze, walidacja, autoryzacja, sortowanie, relacje i operacje wspolne.
- `src/types` - wspolne typy domenowe.
- `docs/finalizacja` - materialy pomocnicze do obrony i prezentacji.

Najwazniejsze komendy:

- `npm run dev` - uruchamia aplikacje lokalnie.
- `npm run typecheck` - sprawdza typy TypeScript.
- `npm run lint` - sprawdza kod przez ESLint.
- `npm test` - uruchamia testy Vitest.

Na obronie warto powiedziec, ze projekt nie jest tylko frontendem. Next.js obsluguje tez czesc backendowa przez pliki `route.ts` w katalogu `src/app/api`.

## 2. Frontend: komponenty i stan aplikacji

Frontend jest zbudowany z komponentow React. Kazdy wiekszy obszar aplikacji ma osobne komponenty:

- `TaskForm` - formularz tworzenia i edycji taskow.
- `ChecklistForm` - formularz checklist.
- `NoteCreateForm` i `NoteDetailsPanel` - tworzenie i edycja notatek.
- `ProjectForm` - formularz projektu, taskow projektu i kolumn Kanban.
- `ProjectKanbanBoard` - tablica Kanban projektu.
- `ProjectTaskView` - przelaczanie miedzy widokiem listy i Kanbanem w projekcie.
- `ObjectCard` - wspolny kafelek elementu na stronach list.
- `ListControls` - wspolny searchbar, sortowanie, filtrowanie i reset filtrow.
- `ReorderableList` - wspolny komponent drag and drop dla list elementow.
- `ArchiveItemsSearch` - widok archiwum z filtrowaniem, sortowaniem i akcjami.

W komponentach uzyto typowych mechanizmow Reacta:

- `useState` - lokalny stan, np. aktualnie przeciagany element, wartosci formularzy, komunikaty bledu.
- `useEffect` - synchronizacja stanu lokalnego z danymi przekazanymi z serwera.
- `useMemo` - wyliczanie danych pochodnych, np. przefiltrowanych elementow albo list kolumn.

Przykladowa odpowiedz na obronie:

> Interfejs zostal podzielony na mniejsze komponenty, poniewaz formularze, listy, kafelki, searchbar i widok Kanban maja osobna odpowiedzialnosc. Dzieki temu kod jest latwiejszy do testowania i utrzymania.

## 3. Backend: Route Handlers

Backend znajduje sie w `src/app/api`. Next.js pozwala tam tworzyc endpointy przez funkcje:

- `GET` - pobieranie danych.
- `POST` - tworzenie danych.
- `PATCH` - aktualizacja danych.
- `DELETE` - archiwizacja albo trwale usuniecie.

Przyklady endpointow:

- `src/app/api/tasks/route.ts` - lista taskow i tworzenie taska.
- `src/app/api/tasks/[taskId]/route.ts` - odczyt, aktualizacja i archiwizacja konkretnego taska.
- `src/app/api/projects/route.ts` - tworzenie projektow.
- `src/app/api/projects/[projectId]/route.ts` - aktualizacja projektu, kolumn Kanban i widoku taskow.
- `src/app/api/checklists/route.ts` - tworzenie checklist.
- `src/app/api/notes/route.ts` - tworzenie notatek.
- `src/app/api/pins/route.ts` - przypinanie elementow do dashboardu.
- `src/app/api/reorder/route.ts` - zapisywanie kolejnosci elementow po drag and drop.
- `src/app/api/archive/[entityType]/[entityId]/route.ts` - przywracanie i trwale usuwanie elementow z archiwum.

Typowy przebieg requestu:

1. Frontend wysyla `fetch` do endpointu API.
2. Endpoint sprawdza, czy uzytkownik jest zalogowany.
3. Dane requestu sa walidowane przez Zod.
4. Dane sa czyszczone z niedozwolonych pol.
5. Endpoint wykonuje operacje na modelu Mongoose.
6. Backend zwraca odpowiedz JSON.
7. Frontend odswieza widok albo przekierowuje uzytkownika.

Warto zapamietac:

- Endpointy nie ufaja danym z frontendu.
- Kazde zapytanie do danych uzytkownika uwzglednia `ownerId`.
- Elementy archiwizowane maja `archivedAt`, a nie sa od razu usuwane z bazy.

## 4. Autentykacja i autoryzacja

Logowanie jest oparte na Auth.js/NextAuth. Konfiguracja znajduje sie w `src/lib/auth.ts`.

Najwazniejsze elementy:

- Uzyto providerow Google i GitHub.
- Dane kont OAuth sa przechowywane przez MongoDB Adapter.
- Sesja zawiera identyfikator uzytkownika.
- Endpointy sprawdzaja aktualnego uzytkownika przez funkcje z `src/lib/session.ts` albo guardy z `src/lib/api-guards.ts`.

Autentykacja odpowiada na pytanie: kim jest uzytkownik.

Autoryzacja odpowiada na pytanie: czy ten uzytkownik ma prawo wykonac dana operacje.

W aplikacji autoryzacja jest realizowana glownie przez `ownerId`. Przyklad: task jest pobierany przez filtr:

```ts
{ _id: taskId, ownerId, archivedAt: null }
```

Oznacza to, ze nawet jesli ktos zna identyfikator cudzego taska, endpoint nie zwroci danych, bo `ownerId` nie bedzie pasowal.

Wazna decyzja w kodzie: w `src/lib/auth.ts` wylaczono laczenie kont po samym adresie e-mail. Dzieki temu konto GitHub i konto Google moga pozostac osobnymi kontami, jesli uzytkownik loguje sie roznymi providerami.

## 5. Modele Mongoose i baza danych

Modele znajduja sie w `src/models`.

Najwazniejsze modele:

- `Task` - taski uzytkownika.
- `Project` - projekty, kolumny Kanban i widok taskow.
- `Checklist` - checklisty i ich elementy.
- `Note` - notatki i powiazania z innymi elementami.
- `Pin` - przypiete elementy dashboardu.
- `UserPreference` - ustawienia motywu i kolorow.
- `ActivityEvent` - zdarzenia do odswiezania danych.

Najwazniejsze pola:

- `ownerId` - wlasciciel dokumentu.
- `archivedAt` - data archiwizacji; `null` oznacza aktywny element.
- `position` - kolejnosc elementow ustawiana przez uzytkownika.
- `tags` - tablica tagow.
- `projectId` - powiazanie taska z projektem.
- `statusId` - status taska; w projekcie odpowiada identyfikatorowi kolumny Kanban.
- `kanbanColumns` - tablica kolumn zapisana w projekcie.
- `linkedItems` - powiazania notatki z innymi elementami.

Dlaczego MongoDB pasuje do tej aplikacji:

- Dokumenty moga przechowywac zagniezdzone struktury, np. elementy checklisty albo kolumny Kanban projektu.
- Struktura taskow, notatek i projektow jest elastyczna.
- Powiazania mozna modelowac przez identyfikatory, bez tworzenia wielu tabel lacznikowych.

Dlaczego Mongoose:

- Definiuje schemat danych.
- Pozwala ustawic wartosci domyslne, indeksy i typy pol.
- Ulatwia prace z MongoDB w TypeScript/Node.js.

## 6. Walidacja danych przez Zod

Schematy walidacji sa w `src/lib/validation-schemas.ts`.

Walidowane sa miedzy innymi:

- tytuly,
- opisy,
- priorytety,
- statusy,
- identyfikatory MongoDB,
- tablice tagow,
- elementy checklist,
- kolumny Kanban,
- payload reorder.

Przyklad: `taskCreateSchema` sprawdza, czy task ma poprawny tytul, priorytet, status, date, tagi i powiazania.

Dlaczego walidacja jest wazna:

- Frontend mozna ominac, wysylajac request recznie.
- Backend musi samodzielnie sprawdzic dane.
- Zod pozwala odrzucic niepoprawny request zanim trafi do bazy.

Warto wspomniec tez o funkcji `parseJsonBody` z `src/lib/api-request.ts`, ktora laczy odczyt JSON z walidacja schematem.

## 7. Sanitizacja danych

Walidacja sprawdza ksztalt danych, a sanitizacja usuwa pola, ktorych uzytkownik nie powinien sam ustawiac.

Przyklady:

- `sanitizeMutation` usuwa niedozwolone pola z payloadu.
- `sanitizeNoteMutation` ogranicza pola notatki do tych, ktore mozna aktualizowac.

Dzieki temu uzytkownik nie moze przez API samodzielnie ustawic np. `ownerId`, `archivedAt` albo innych pol technicznych.

Mozliwa odpowiedz na pytanie:

> Walidacja sprawdza, czy dane maja dobry format, a sanitizacja pilnuje, zeby do bazy trafily tylko pola dopuszczone przez aplikacje.

## 8. Taski

Task jest podstawowym elementem pracy w aplikacji.

Kod zwiazany z taskami:

- `src/models/task.ts` - model danych.
- `src/app/api/tasks/route.ts` - pobieranie i tworzenie taskow.
- `src/app/api/tasks/[taskId]/route.ts` - szczegoly, aktualizacja i archiwizacja.
- `src/components/tasks/task-form.tsx` - formularz tworzenia i edycji.
- `src/components/tasks/task-details-panel.tsx` - panel szczegolow.
- `src/lib/validation-schemas.ts` - walidacja taska.

Task moze:

- miec tytul i opis,
- miec priorytet,
- miec date wykonania,
- miec tagi,
- byc przypisany do projektu,
- miec status,
- miec powiazane checklisty i notatki,
- miec pozycje w kolejnosci uzytkownika.

Po utworzeniu taska formularz odczytuje identyfikator z odpowiedzi API przez `getCreatedEntityId` i przekierowuje na strone nowo utworzonego taska.

## 9. Projekty i widoki taskow projektu

Projekt grupuje taski, checklisty i kolumny Kanban.

Kod zwiazany z projektami:

- `src/models/project.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[projectId]/route.ts`
- `src/components/projects/project-form.tsx`
- `src/components/projects/project-details-panel.tsx`
- `src/components/projects/project-task-view.tsx`
- `src/components/projects/project-kanban-board.tsx`

Projekt ma dwa widoki taskow:

- Kanban,
- lista.

Wybrany widok jest zapisany w polu `taskView`, dzieki czemu aplikacja pamieta preferencje uzytkownika dla projektu.

Kolumny Kanban sa zapisane w dokumencie projektu w polu `kanbanColumns`. Kazda kolumna ma:

- `id`,
- `title`,
- `position`,
- `color`,
- `isDone`.

Task znajdujacy sie w kolumnie ma `statusId` rowne `id` kolumny.

## 10. Drag and drop w Kanbanie

Drag and drop w Kanbanie znajduje sie w `src/components/projects/project-kanban-board.tsx`.

Najwazniejsze stany:

- `draggedTaskId` - aktualnie przeciagany task.
- `activeDropColumnId` - kolumna, nad ktora znajduje sie przeciagany task.
- `activeDropTaskId` - task, nad ktorym aktualnie znajduje sie przeciagany task.
- `boardTasks` - lokalna lista taskow wyswietlana na tablicy.

Najwazniejsze zdarzenia HTML Drag and Drop:

- `onDragStart` - zapisuje identyfikator przeciaganego taska.
- `onDragOver` - pozwala wykonac drop i zaznacza aktywne miejsce.
- `onDrop` - wykonuje przeniesienie taska.
- `onDragEnd` - czysci stan przeciagania.

Jak dziala przenoszenie:

1. Uzytkownik lapie karte taska.
2. Aplikacja zapisuje `draggedTaskId`.
3. Gdy task zostanie upuszczony na kolumne, trafia na koniec tej kolumny.
4. Gdy task zostanie upuszczony na inna karte, zostaje ustawiony w tym miejscu.
5. Funkcja `buildMovedTaskOrder` przelicza kolejnosc taskow.
6. Jesli task zmienil kolumne, endpoint taska aktualizuje `statusId`.
7. Endpoint `/api/reorder` zapisuje nowe wartosci `position`.

Wazny szczegol:

- Zmiana kolumny i zmiana kolejnosci to dwie rozne rzeczy.
- `statusId` okresla kolumne.
- `position` okresla miejsce taska w kolumnie.

Na pytanie "jak wykonano drag and drop?" mozna odpowiedziec:

> Wykorzystano natywne zdarzenia HTML Drag and Drop. Komponent zapisuje identyfikator przeciaganego taska, wyznacza docelowa kolumne lub docelowa karte, lokalnie przelicza kolejnosc, a nastepnie zapisuje zmiany przez endpointy API. Zmiana kolumny aktualizuje `statusId`, a zmiana kolejnosci aktualizuje pole `position`.

## 11. Drag and drop poza Kanbanem

Poza Kanbanem do zmiany kolejnosci sluzy wspolny komponent `ReorderableList`.

Kod:

- `src/components/dashboard/reorderable-list.tsx`
- `src/app/api/reorder/route.ts`

Obslugiwane typy:

- piny,
- notatki,
- checklisty,
- taski,
- projekty.

Mechanizm:

1. Komponent renderuje elementy z uchwytem drag and drop.
2. Po upuszczeniu elementu lokalnie zmienia kolejnosc.
3. Wysyla do `/api/reorder` tablice `{ id, position }`.
4. Backend sprawdza, czy wszystkie identyfikatory sa poprawne i naleza do uzytkownika.
5. Backend wykonuje `bulkWrite`, czyli aktualizuje wiele dokumentow naraz.

Dlaczego `bulkWrite`:

- Jest wydajniejsze niz wiele osobnych requestow.
- Pozwala zapisac cala kolejnosc jednym wywolaniem backendu.

## 12. Formularz projektu i drag and drop kolumn

W formularzu projektu kolumny Kanban rowniez mozna przestawiac przez drag and drop.

Kod:

- `src/components/projects/project-form.tsx`

Wazny problem, ktory zostal rozwiazany:

- Wczesniej `key` kolumny zalezal od `id` kolumny.
- `id` zmienial sie podczas wpisywania tytulu.
- React odmontowywal input po kazdym znaku i input tracil fokus.

Rozwiazanie:

- Dodano stabilne `formId`, uzywane tylko po stronie formularza.
- `formId` nie zmienia sie podczas edycji tytulu.
- Dzieki temu React nie tworzy inputu od nowa po kazdej literze.

To jest dobry przyklad pytania technicznego na obronie:

> Problem wynikal z niestabilnego klucza Reacta. Klucz elementu listy nie powinien zmieniac sie podczas edycji. Dodanie osobnego `formId` rozdzielilo identyfikator techniczny formularza od identyfikatora kolumny zapisywanego w danych.

## 13. Searchbar, filtrowanie i sortowanie

Wspolny searchbar i filtry sa w `src/components/dashboard/list-controls.tsx`.

Elementy list korzystaja z podobnego ukladu:

- input wyszukiwania,
- filtrowanie po priorytecie/statusie/relacji,
- sortowanie,
- reset filtrow,
- przycisk tworzenia nowego elementu.

Sortowanie jest opisane w `src/lib/list-query.ts`.

Opcja `User's Order` odpowiada polu `position`. Gdy uzytkownik wybiera te opcje:

- elementy wyswietlaja sie wedlug wlasnej kolejnosci,
- drag and drop jest aktywny,
- przycisk ascending/descending jest ukrywany, bo kolejnosc uzytkownika nie jest zwyklym sortowaniem alfabetycznym.

Filtrowanie po relacji:

- `Linked` - element ma jakiekolwiek powiazanie.
- `Linked to Project` - element jest podpiety do projektu.
- `Linked to Task` - element jest podpiety do taska.

Warto powiedziec, ze projekty nie sa filtrowane po relacji, bo nie sa podpiete pod inne elementy w tym samym sensie.

## 14. Archiwum

Archiwum znajduje sie w:

- `src/app/dashboard/archive/page.tsx`
- `src/components/dashboard/archive-items-search.tsx`
- `src/app/api/archive/[entityType]/[entityId]/route.ts`

Zasada:

- zwykle usuniecie w aplikacji oznacza archiwizacje,
- element otrzymuje `archivedAt`,
- element znika z list aktywnych,
- w archiwum mozna go przywrocic albo usunac trwale.

Dlaczego archiwizacja:

- Chroni przed przypadkowa utrata danych.
- Pozwala zachowac spojne powiazania.
- Uzytkownik moze odzyskac element.

Przywracanie:

- endpoint `PATCH` w `/api/archive/[entityType]/[entityId]` ustawia `archivedAt: null`.

Trwale usuwanie:

- endpoint `DELETE` usuwa dokument dopiero z poziomu archiwum.
- Przy usuwaniu czyszczone sa powiazania z innymi elementami przez funkcje z `entity-relations.ts`.

## 15. Piny i dashboard

Piny odpowiadaja za przypiete elementy na dashboardzie.

Kod:

- `src/models/pin.ts`
- `src/app/api/pins/route.ts`
- `src/app/api/pins/[pinId]/route.ts`
- `src/components/dashboard/pin-entity-button.tsx`
- `src/components/dashboard/pinned-board.tsx`
- `src/components/dashboard/pinned-items-search.tsx`

Pin zapisuje:

- `ownerId`,
- `targetType`,
- `targetId`,
- `position`.

`targetType` okresla, czy pin dotyczy taska, projektu, checklisty czy notatki.

Dashboard musi potem "rozwiazac" pin, czyli pobrac dokument z odpowiedniej kolekcji.

Warto zapamietac:

- Pin nie kopiuje calego taska albo projektu.
- Pin przechowuje tylko odniesienie do elementu.
- Dzieki temu aktualizacja taska jest widoczna takze w przypietym kafelku.

## 16. Nawigacja i `returnTo`

Mechanizm powrotu do poprzedniego widoku znajduje sie w:

- `src/components/dashboard/return-to-link.tsx`
- `src/lib/return-to.ts`

Problem:

- Uzytkownik mogl wejsc do taska z Kanbana, listy, dashboardu albo przypietych elementow.
- Przycisk `Back` nie powinien zawsze wracac do ogolnej listy taskow.

Rozwiazanie:

- Linki do szczegolow dodaja parametr `returnTo`.
- Strona szczegolow odczytuje `returnTo`.
- Funkcja `getSafeReturnTo` sprawdza, czy adres jest bezpieczny i zaczyna sie od `/dashboard`.
- Przycisk `Back` prowadzi do zapamietanego widoku.

Przyklad:

- Wejscie z projektu: `/dashboard/tasks/123?returnTo=/dashboard/projects/abc`
- Klikniecie `Back` wraca do projektu.

To zabezpiecza tez przed open redirect, bo aplikacja nie przyjmie zewnetrznego adresu jako celu powrotu.

## 17. Tworzenie elementu i przekierowanie do szczegolow

Po utworzeniu elementu aplikacja przenosi uzytkownika na strone nowo utworzonego elementu.

Kod:

- `src/lib/created-entity-response.ts`
- formularze: `TaskForm`, `ChecklistForm`, `NoteCreateForm`, `ProjectForm`

Mechanizm:

1. Formularz wysyla `POST`.
2. API zwraca np. `{ task }`, `{ project }`, `{ checklist }` albo `{ note }`.
3. Helper `getCreatedEntityId` odczytuje `id` albo `_id`.
4. Frontend wykonuje `router.push` na strone szczegolow.

Dlaczego dodano fallback:

- Rozne odpowiedzi Mongoose moga zawierac `id`, `_id` albo obiekt z `$oid`.
- Helper obsluguje kilka wariantow, zeby formularze byly odporne na ksztalt odpowiedzi.

## 18. Motywy kolorystyczne i preferencje uzytkownika

Kod:

- `src/components/theme/theme-provider.tsx`
- `src/components/theme/color-theme-settings.tsx`
- `src/lib/color-settings.ts`
- `src/models/user-preference.ts`
- `src/app/api/user-preferences/route.ts`

Aplikacja obsluguje:

- tryb light,
- tryb dark,
- tryb system,
- domyslne motywy,
- motywy uzytkownika,
- kolory kafelkow dashboardu.

Mechanizm:

- `ThemeProvider` przechowuje stan motywu.
- Ustawienia sa zapisywane przez endpoint `user-preferences`.
- Kolory sa wystawiane jako zmienne CSS.
- Komponenty korzystaja z tych zmiennych, np. `var(--app-accent)`.

Na obronie warto powiedziec:

> Motywy nie sa tylko zmiana klasy CSS. Ustawienia uzytkownika sa zapisywane w bazie, a frontend odczytuje je i ustawia jako zmienne CSS, dzieki czemu wiele komponentow reaguje na jeden centralny zestaw kolorow.

## 19. Realtime refresh

Kod:

- `src/components/layout/realtime-refresh.tsx`
- `src/app/api/realtime/route.ts`
- `src/lib/activity-events.ts`
- `src/models/activity-event.ts`

Mechanizm nie jest pelnym WebSocketem. To prostszy polling:

1. Aplikacja co pewien czas pyta endpoint realtime o najnowsze zdarzenia.
2. Backend sprawdza kolekcje `activityevents`.
3. Jesli pojawily sie nowe zdarzenia, frontend moze odswiezyc dane.

Polling oznacza okresowe pytanie serwera o zmiany. WebSocket oznaczalby stale polaczenie, w ktorym serwer sam wysyla informacje do klienta.

Dlaczego polling:

- Jest prostszy.
- Wystarcza dla jednoosobowej aplikacji organizacyjnej.
- Nie wymaga osobnej infrastruktury WebSocket.

## 20. Powiazania miedzy elementami

Powiazania sa obslugiwane w kilku miejscach:

- task moze nalezec do projektu przez `projectId`,
- task moze miec checklisty przez `checklistIds`,
- projekt moze miec checklisty i taski,
- checklist moze miec `parentType` i `parentId`,
- notatka moze miec `linkedItems`.

Kod pomocniczy:

- `src/lib/entity-relations.ts`
- `src/lib/entity-note-links.ts`
- `src/lib/note-links.ts`

Przy archiwizacji lub trwalym usunieciu trzeba czyscic powiazania, zeby aplikacja nie wskazywala na nieistniejace albo zarchiwizowane elementy.

Przyklad:

- Gdy projekt jest archiwizowany, taski moga zostac odpiete od projektu.
- Gdy checklist zostaje usunieta, trzeba usunac jej identyfikator z taskow i projektow.

## 21. Checklista

Kod:

- `src/models/checklist.ts`
- `src/app/api/checklists/route.ts`
- `src/app/api/checklists/[checklistId]/route.ts`
- `src/components/checklists/checklist-form.tsx`
- `src/components/checklists/checklist-details-panel.tsx`

Checklist sklada sie z elementow. Kazdy element moze miec:

- tytul,
- informacje, czy jest wykonany,
- date wykonania,
- pozycje.

W szczegolach checklisty elementy mozna edytowac i ustawiac w kolejnosci. To dziala lokalnie w komponencie, a pozniej zapisuje caly zaktualizowany zestaw elementow.

Checklist moze byc samodzielna albo podpieta pod task/projekt.

## 22. Notatki

Kod:

- `src/models/note.ts`
- `src/app/api/notes/route.ts`
- `src/app/api/notes/[noteId]/route.ts`
- `src/components/notes/note-create-form.tsx`
- `src/components/notes/note-details-panel.tsx`

Notatka zawiera:

- tytul,
- tresc,
- tagi,
- powiazane elementy.

Notatki moga byc laczone z taskami, projektami, checklistami i innymi notatkami. Linki sa zapisane jako `linkedItems`, czyli tablica obiektow z `targetType` i `targetId`.

Wazne:

- Przed zapisem backend sprawdza, czy linkowane elementy istnieja i naleza do uzytkownika.
- Dzieki temu uzytkownik nie moze podpiac cudzych albo nieistniejacych dokumentow.

## 23. Stylowanie i UI

Stylowanie jest oparte na Tailwind CSS oraz klasach pomocniczych w `src/app/globals.css`.

Wspolne klasy:

- `app-page`,
- `app-page-header`,
- `app-form-panel`,
- `app-form-control`,
- `app-form-hint`,
- `app-primary-action`,
- `app-controls-panel`.

Dlaczego wprowadzono klasy wspolne:

- Powtarzalne elementy wygladaja spojnie.
- Zmiana np. inputow formularza wymaga poprawy w jednym miejscu.
- Kod komponentow jest krotszy.

Przyklad decyzji UI:

- Przyciski przesuwania zostaly usuniete tam, gdzie pojawil sie drag and drop.
- Puste stany list sa spójne i nie maja zbednych ramek.
- Ikony stron i formularzy pomagaja uzytkownikowi rozpoznac kontekst.

## 24. Testy

Testy sa uruchamiane przez Vitest.

Konfiguracja:

- `vitest.config.ts`,
- `vitest.setup.ts`.

Rodzaje testow:

- testy walidacji,
- testy endpointow API,
- testy formularzy,
- testy komponentow kontroli listy.

Przyklady testowanych plikow:

- `src/lib/task-validation.test.ts`,
- `src/app/api/tasks/route.test.ts`,
- `src/app/api/tasks/[taskId]/route.test.ts`,
- `src/app/api/reorder/route.test.ts`,
- `src/app/api/archive/[entityType]/[entityId]/route.test.ts`,
- `src/components/tasks/task-form.test.tsx`,
- `src/components/checklists/checklist-form.test.tsx`,
- `src/components/notes/note-create-form.test.tsx`,
- `src/components/dashboard/list-controls.test.tsx`.

W testach endpointow mockowane sa:

- modele Mongoose,
- sesja uzytkownika,
- funkcje pomocnicze,
- odpowiedzi API.

Co warto powiedziec:

> Testy nie lacza sie z prawdziwa baza danych. Sprawdzaja logike handlerow i komponentow w izolacji, dzieki mockom. To pozwala szybko zweryfikowac walidacje, autoryzacje, wywolania modeli i reakcje formularzy.

Ograniczenia testow:

- Brakuje pelnych testow end-to-end.
- Nie jest testowana prawdziwa baza produkcyjna.
- Nie wszystkie scenariusze UI sa objete automatycznie.

## 25. Rate limiting i odpowiedzi API

W endpointach wykorzystywany jest prosty rate limit.

Kod:

- `src/lib/rate-limit.ts`
- `src/lib/api-guards.ts`
- `src/lib/api-responses.ts`

Po co rate limiting:

- Ogranicza zbyt czeste wywolywanie endpointow.
- Chroni API przed przypadkowym spamem requestow.
- Jest szczegolnie przydatny przy operacjach tworzenia, aktualizacji i usuwania.

Wspolne odpowiedzi:

- `badRequestResponse`,
- `unauthorizedResponse`,
- `notFoundResponse`,
- `tooManyRequestsResponse`.

Dzieki temu endpointy zwracaja spojne komunikaty i kody HTTP.

## 26. Co umiec narysowac lub wytlumaczyc przy tablicy

Przeplyw utworzenia taska:

1. Uzytkownik wypelnia formularz.
2. `TaskForm` wykonuje `fetch("/api/tasks")`.
3. `taskCreateSchema` waliduje dane.
4. Endpoint sprawdza sesje i `ownerId`.
5. Backend sprawdza powiazany projekt/checklisty/notatki.
6. `Task.create` zapisuje dokument.
7. Jesli task ma projekt, projekt dostaje ten task w `taskIds`.
8. Endpoint zwraca `{ task }`.
9. Formularz odczytuje `id`.
10. Frontend przekierowuje na `/dashboard/tasks/<id>`.

Przeplyw drag and drop w Kanbanie:

1. `onDragStart` zapisuje `draggedTaskId`.
2. `onDragOver` ustawia aktywna kolumne lub aktywna karte.
3. `onDrop` znajduje task z `boardTasks`.
4. `buildMovedTaskOrder` przelicza status i pozycje.
5. Lokalny stan jest aktualizowany natychmiast.
6. API zapisuje `statusId`, jesli zmienila sie kolumna.
7. `/api/reorder` zapisuje pozycje taskow.
8. `router.refresh()` odswieza dane z serwera.

Przeplyw archiwizacji:

1. Uzytkownik klika przycisk archiwizacji.
2. Pojawia sie modal potwierdzajacy.
3. Frontend wysyla `DELETE` do endpointu elementu.
4. Endpoint ustawia `archivedAt`.
5. Element znika z list aktywnych.
6. Element jest dostepny w archiwum.

## 27. Najbardziej prawdopodobne pytania o kod

### Jak dziala drag and drop?

Przez natywne zdarzenia HTML Drag and Drop. Komponent zapisuje identyfikator przeciaganego elementu, po upuszczeniu przelicza kolejnosc lokalnie i zapisuje nowe `position` przez endpoint `/api/reorder`.

### Czym rozni sie `statusId` od `position`?

`statusId` mowi, w ktorej kolumnie Kanban znajduje sie task. `position` mowi, w ktorym miejscu wewnatrz tej kolumny albo listy znajduje sie element.

### Dlaczego pozycjonowanie zapisano w bazie?

Bo kolejnosc ustawiona przez uzytkownika musi zostac zachowana po odswiezeniu strony i po ponownym zalogowaniu.

### Jak zabezpieczono dane uzytkownika?

Kazdy dokument ma `ownerId`, a endpointy pobieraja i aktualizuja dane tylko z filtrem `ownerId`. Do tego wymagane jest zalogowanie przez sesje Auth.js.

### Jak dziala archiwum?

Standardowe usuniecie ustawia `archivedAt`, czyli wykonuje soft delete. Dopiero w archiwum mozna usunac element trwale.

### Dlaczego uzyto MongoDB?

Bo aplikacja ma dokumentowe, elastyczne struktury: checklisty maja zagniezdzone elementy, projekty maja kolumny Kanban, notatki maja tablice powiazan, a taski moga miec rozne opcjonalne pola.

### Dlaczego uzyto Zod?

Zod waliduje requesty po stronie backendu. Dzieki temu API nie ufa danym z formularza i odrzuca niepoprawne payloady.

### Jak dziala przypinanie elementow?

Pin zapisuje `targetType` i `targetId`, a dashboard na tej podstawie pobiera wlasciwy dokument. Pin nie kopiuje calego elementu.

### Jak dziala powrot `Back`?

Linki do szczegolow dodaja parametr `returnTo`. Strona szczegolow sprawdza go funkcja `getSafeReturnTo` i uzywa jako celu przycisku `Back`.

### Czym sa Route Handlers?

To backendowe endpointy Next.js w katalogu `src/app/api`. Eksportuja funkcje HTTP takie jak `GET`, `POST`, `PATCH`, `DELETE`.

### Czy aplikacja ma realtime?

Ma prosty mechanizm odswiezania oparty na polling, czyli okresowym pytaniu serwera o zdarzenia. Nie jest to pelny WebSocket.

### Jakie sa ograniczenia projektu?

Najwazniejsze ograniczenia to brak pelnych testow end-to-end, brak wspoldzielenia projektow miedzy uzytkownikami oraz prostszy mechanizm odswiezania niz WebSocket.

## 28. Rzeczy, ktore warto przejrzec w kodzie przed obrona

Przed obrona otworz i przejrzyj:

- `src/components/projects/project-kanban-board.tsx` - drag and drop Kanbana.
- `src/components/dashboard/reorderable-list.tsx` - drag and drop list.
- `src/app/api/reorder/route.ts` - zapis kolejnosci.
- `src/app/api/tasks/route.ts` - tworzenie taska.
- `src/app/api/tasks/[taskId]/route.ts` - aktualizacja, archiwizacja i powiazania taska.
- `src/app/api/archive/[entityType]/[entityId]/route.ts` - archiwum.
- `src/lib/auth.ts` - konfiguracja logowania.
- `src/lib/validation-schemas.ts` - walidacja Zod.
- `src/models/project.ts` - kolumny Kanban w modelu projektu.
- `src/models/task.ts` - `statusId`, `projectId`, `position`, `archivedAt`.
- `src/components/dashboard/list-controls.tsx` - searchbar, filtry, sortowanie.
- `src/components/dashboard/return-to-link.tsx` - nawigacja z `returnTo`.
- `src/lib/created-entity-response.ts` - przekierowanie po utworzeniu elementu.
- `src/components/theme/theme-provider.tsx` - motywy i preferencje.
- `src/app/api/user-preferences/route.ts` - zapis ustawien uzytkownika.
- `src/app/api/tasks/route.test.ts` - przyklad testu endpointu.
- `src/components/tasks/task-form.test.tsx` - przyklad testu formularza.

## 29. Krotkie odpowiedzi do zapamietania

- Frontend pokazuje interfejs i wysyla requesty.
- Backend sprawdza sesje, waliduje dane i zapisuje je w MongoDB.
- `ownerId` chroni dane uzytkownika.
- `archivedAt` realizuje soft delete.
- `position` zapisuje kolejnosc ustawiona przez uzytkownika.
- `statusId` laczy task z kolumna Kanban.
- `returnTo` pozwala wrocic do poprzedniego widoku.
- `Pin` przechowuje odniesienie do elementu, a nie jego kopie.
- Zod waliduje wejscie API.
- Mongoose opisuje strukture dokumentow MongoDB.
- Vitest sprawdza logike bez prawdziwej bazy przez mocki.
- Polling okresowo pyta serwer o zmiany; WebSocket utrzymuje stale polaczenie.

## 30. Jak mowic o kodzie podczas prezentacji

Najlepiej mowic konkretnie:

- zamiast "aplikacja zapisuje dane", powiedz "formularz wysyla request do Route Handlera, backend waliduje payload przez Zod i zapisuje dokument Mongoose w MongoDB";
- zamiast "jest drag and drop", powiedz "komponent zapisuje `draggedTaskId`, przelicza `position` i zapisuje nowa kolejnosc przez `/api/reorder`";
- zamiast "jest bezpieczenstwo", powiedz "kazdy endpoint sprawdza sesje i filtruje dokumenty po `ownerId`";
- zamiast "jest usuwanie", powiedz "standardowe usuniecie to archiwizacja przez `archivedAt`, a trwale usuniecie jest dostepne dopiero w archiwum";
- zamiast "sa testy", powiedz "testy Vitest mockuja modele Mongoose i sprawdzaja walidacje, logike handlerow oraz wybrane formularze".

Najwazniejsze: komisja nie oczekuje znajomosci kazdej linijki, ale moze zapytac o decyzje techniczne. Trzeba umiec wyjasnic, po co istnieja `ownerId`, `position`, `statusId`, `archivedAt`, `returnTo`, Route Handlers, modele Mongoose i walidacja Zod.
