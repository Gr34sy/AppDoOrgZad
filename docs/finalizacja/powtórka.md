# Powtórka przed obroną

## 1. Cel aplikacji

- Aplikacja służy do indywidualnej organizacji zadań, checklist, notatek i projektów.
- Główny problem, który rozwiązuje, to rozproszenie informacji: użytkownik może mieć osobne zadania, checklisty, notatki i projekty, ale aplikacja pozwala je łączyć oraz przypinać najważniejsze elementy do dashboardu.
- Praca nie opisuje dużego systemu zespołowego, tylko aplikację nastawioną na pojedynczego użytkownika.

## 2. Najważniejsze funkcje

- Logowanie przez zewnętrznych dostawców OAuth: Google i GitHub.
- Tworzenie, edycja, pobieranie i archiwizacja tasków, projektów, checklist oraz notatek.
- Przypinanie elementów do dashboardu za pomocą mechanizmu pinów.
- Łączenie notatek z innymi elementami aplikacji.
- Dodawanie checklist do tasków i projektów.
- Praca z projektem w dwóch widokach: lista tasków oraz tablica Kanban.
- Konfiguracja kolumn Kanban na poziomie projektu.
- Filtrowanie, wyszukiwanie i sortowanie elementów.
- Personalizacja wyglądu aplikacji przez preferencje użytkownika.
- Podstawowe testy jednostkowe logiki walidacji oraz handlerów API.

## 3. Architektura aplikacji

- Aplikacja działa w architekturze klient-serwer.
- Frontend odpowiada za interfejs użytkownika, formularze, widoki list, dashboard oraz tablicę Kanban.
- Backend odpowiada za obsługę żądań API, walidację danych, sprawdzanie sesji, zapis w bazie i zwracanie odpowiedzi.
- Baza danych przechowuje trwały stan aplikacji: użytkowników, konta OAuth, taski, projekty, checklisty, notatki, piny, preferencje i zdarzenia aktywności.
- W projekcie użyto struktury typowej dla Next.js App Router: widoki znajdują się w katalogu `src/app`, a endpointy API w `src/app/api`.

## 4. Technologie frontendowe

- `React` odpowiada za budowanie interfejsu z komponentów.
- Komponenty pozwalają dzielić UI na mniejsze części, np. `TaskForm`, `ProjectForm`, `ObjectCard`, `FormShell`, `PinnedBoard`, `ProjectKanbanBoard`.
- `useState` przechowuje lokalny stan komponentów, np. wartości formularzy, przeciągany task, aktywną kolumnę lub błędy.
- `useEffect` synchronizuje stan komponentu z danymi przekazanymi z serwera.
- `useMemo` służy do wyliczania danych pochodnych, np. posortowanych kolumn lub przefiltrowanych list.
- `TypeScript` pomaga kontrolować strukturę danych i wykrywać błędy typów przed uruchomieniem aplikacji.
- `Tailwind CSS` pozwala stylować komponenty klasami narzędziowymi bez pisania wielu osobnych plików CSS.
- `lucide-react` dostarcza ikony używane w przyciskach i elementach interfejsu.

## 5. Technologie backendowe

- `Next.js` obsługuje nie tylko frontend, ale też część serwerową przez Route Handlers.
- Route Handlers to funkcje `GET`, `POST`, `PATCH`, `DELETE` umieszczone w plikach `route.ts`.
- Endpointy API odpowiadają między innymi za taski, projekty, checklisty, notatki, piny, preferencje użytkownika, autoryzację i zdarzenia realtime.
- `NextResponse.json` służy do zwracania odpowiedzi JSON.
- `NextRequest` służy do odczytu danych z żądania.
- Wspólne funkcje pomocnicze ograniczają powtarzanie kodu, np. `parseJsonBody`, `badRequestResponse`, `unauthorizedResponse`, `sanitizeMutation`, `getCurrentUserId`.

## 6. Autentykacja i autoryzacja

- Autentykacja oznacza potwierdzenie tożsamości użytkownika.
- Autoryzacja oznacza sprawdzenie, do jakich danych i operacji użytkownik ma dostęp.
- W aplikacji użyto `NextAuth/Auth.js` z providerami Google i GitHub.
- Dane kont OAuth są przechowywane przez adapter MongoDB.
- Sesja działa w strategii JWT.
- Callback `session` dopisuje `id` użytkownika do obiektu sesji, aby endpointy mogły łatwo ustalić właściciela danych.
- Każdy endpoint sprawdza aktualnego użytkownika przez `getCurrentUserId`.
- Zapytania do bazy zawierają `ownerId`, dzięki czemu użytkownik może pobierać i modyfikować tylko swoje dane.

## 7. Baza danych

- Użyto MongoDB, czyli dokumentowej bazy danych.
- Schemat aplikacji opisano przez modele Mongoose.
- Najważniejsze kolekcje domenowe to `tasks`, `projects`, `checklists`, `notes`, `pins`, `userpreferences`, `activityevents`.
- Kolekcje techniczne Auth.js obejmują między innymi użytkowników, konta i sesje/tokeny.
- `ObjectId` jest identyfikatorem dokumentu w MongoDB.
- Pola typu `Date` przechowują daty, np. termin wykonania, datę ukończenia albo datę archiwizacji.
- Pola typu `string[]` oznaczają tablicę tekstów, np. lista tagów.
- Pole `position` służy do sortowania elementów w ustalonej kolejności.
- Archiwizacja jest realizowana miękko przez pole `archivedAt`, zamiast fizycznego usuwania dokumentu.

## 8. Najważniejsze modele danych

- `Task` zawiera tytuł, opis, priorytet, status, termin, tagi, checklisty, projekt i pozycję.
- `Project` zawiera tytuł, opis, priorytet, termin, listę tasków, listę checklist, kolumny Kanban i wybrany widok tasków.
- `Checklist` zawiera tytuł, elementy checklisty oraz opcjonalne powiązanie z taskiem albo projektem.
- `Note` przechowuje notatki oraz powiązania z innymi elementami aplikacji.
- `Pin` wskazuje dowolny przypięty element przez `targetType` i `targetId`.
- `UserPreference` przechowuje ustawienia wyglądu interfejsu.
- `ActivityEvent` zapisuje zdarzenia używane do odświeżania danych.

## 9. Walidacja danych

- Do walidacji użyto biblioteki `zod`.
- Schematy walidacji znajdują się w `src/lib/validation-schemas.ts`.
- Walidacja sprawdza wymagane pola, maksymalne długości tekstów, poprawne wartości enumów, formaty dat i listy identyfikatorów.
- Endpointy przyjmują tylko dane zgodne ze schematem.
- Funkcja `sanitizeMutation` usuwa wartości niedozwolone lub puste przed zapisem.
- Dzięki walidacji backend nie ufa bezpośrednio danym przesłanym z frontendu.

## 10. Taski

- Task jest podstawowym elementem pracy użytkownika.
- Task może być samodzielny albo przypisany do projektu przez `projectId`.
- Task ma status osobisty albo status wynikający z kolumn Kanban projektu.
- Task może mieć tagi, termin, priorytet, opis i checklisty.
- Przy przeniesieniu taska między projektami backend aktualizuje powiązania po obu stronach: dokument taska i tablice `taskIds` w projektach.

## 11. Projekty i Kanban

- Projekt grupuje taski i checklisty.
- Projekt ma własną konfigurację kolumn Kanban.
- Kolumny mają `id`, `title`, `position`, `color` oraz `isDone`.
- Widok Kanban pokazuje taski jako karty w kolumnach.
- Zmiana kolumny taska aktualizuje jego `statusId`.
- Aplikacja obsługuje też widok listy, a wybrany tryb zapisuje w polu `taskView`.

## 12. Piny i dashboard

- Dashboard pokazuje najważniejsze informacje po zalogowaniu.
- Piny pozwalają przypiąć task, projekt, checklistę albo notatkę.
- Kolekcja `pins` przechowuje typ elementu i jego identyfikator.
- Indeks unikalny na `ownerId`, `targetType`, `targetId` zapobiega podwójnemu przypięciu tego samego elementu.
- Dashboard pobiera przypięte elementy i rozwiązuje je do właściwych dokumentów.

## 13. Realtime i odświeżanie

- Aplikacja zapisuje zdarzenia aktywności w `activityevents`.
- Zdarzenia opisują, że element został utworzony, zaktualizowany, usunięty, przeniesiony albo przypięty.
- Endpoint realtime może sprawdzać najnowsze zdarzenia i pomagać w odświeżaniu widoków.
- Nie jest to pełny system WebSocket, raczej prostszy mechanizm wspierający aktualność interfejsu.

## 14. Testy

- Testy uruchamia się poleceniem `npm test`.
- Projekt korzysta z `Vitest`.
- Testy obejmują walidację tasków oraz wybrane endpointy API.
- Zależności takie jak modele Mongoose i połączenie z bazą są mockowane.
- Testy sprawdzają między innymi tworzenie taska, aktualizację, archiwizację, odrzucenie błędnych danych i powiązanie taska z projektem.
- Ograniczenie testów: nie są to pełne testy end-to-end i nie sprawdzają rzeczywistej bazy danych ani całego UI.

## 15. Co warto umieć powiedzieć na obronie

- Dlaczego wybrano MongoDB: dobrze pasuje do elastycznych, dokumentowych struktur aplikacji, takich jak projekty z kolumnami Kanban, taski z checklistami i notatki z powiązaniami.
- Dlaczego użyto Mongoose: porządkuje schemat danych i daje kontrolę nad polami mimo elastyczności MongoDB.
- Dlaczego użyto Next.js: pozwala połączyć frontend i backend w jednym projekcie.
- Dlaczego użyto TypeScriptu: zmniejsza ryzyko błędów typów podczas rozwoju aplikacji.
- Dlaczego użyto Zod: walidacja danych wejściowych działa po stronie backendu i chroni API przed niepoprawnymi payloadami.
- Dlaczego użyto OAuth: aplikacja nie musi przechowywać haseł użytkowników.
- Dlaczego task i zadanie czasem występują obok siebie: `task` oznacza konkretny element aplikacji, a `zadanie` jest polskim odpowiednikiem używanym w ogólnym opisie.
- Jak działa przypinanie: pin zapisuje typ elementu i jego identyfikator, a dashboard odczytuje właściwy dokument.
- Jak działa Kanban: status taska jest powiązany z identyfikatorem kolumny projektu.
- Co zrobiłeś samodzielnie: analiza wymagań, projekt interfejsu, modele danych, endpointy API, formularze, dashboard, Kanban, autoryzacja, walidacja i testy.

## 16. Typowe pytania komisji

- Jaki problem rozwiązuje aplikacja?
- Czym różni się frontend od backendu w Twoim projekcie?
- Dlaczego wybrałeś MongoDB zamiast MySQL?
- Jak zabezpieczasz dane użytkownika przed dostępem innych osób?
- Jak działa logowanie przez Google/GitHub?
- Co robi `ownerId`?
- Co oznacza `ObjectId`?
- Czym jest Route Handler w Next.js?
- Jak działa walidacja danych?
- Co sprawdzają testy jednostkowe?
- Jak działa przypięcie elementu do dashboardu?
- Jak działa przenoszenie taska między kolumnami Kanban?
- Co można rozwinąć w przyszłości?

## 17. Możliwe kierunki rozwoju

- Dodanie pełnych testów end-to-end.
- Rozbudowa realtime o WebSockety.
- Dodanie współdzielenia projektów między użytkownikami.
- Dodanie powiadomień o zbliżających się terminach.
- Eksport danych użytkownika.
- Rozbudowa filtrowania i widoków kalendarza.
- Dodanie wersji mobilnej jako PWA.
