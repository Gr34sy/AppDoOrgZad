# Rozpiska prezentacji na obrone pracy inzynierskiej

Temat prezentacji: aplikacja webowa do organizacji pracy, zadan, notatek, checklist, projektow i dashboardu.

Cel pliku: uporzadkowany plan slajdow do obrony pracy inzynierskiej. Kazdy slajd zawiera propozycje tresci widocznej na slajdzie oraz notatki do omowienia.

## Slajd 1 - Tytul i temat pracy

Cel slajdu:

- Przedstawic temat pracy i kontekst aplikacji.

Tresci na slajdzie:

- Aplikacja webowa do organizacji pracy i zadan.
- Modulowe zarzadzanie notatkami, zadaniami, checklistami i projektami.
- Dashboard z przypietymi elementami i personalizacja wygladu.

Notatki do omowienia:

- Na poczatku warto powiedziec, ze projekt jest pelna aplikacja webowa, a nie sama makieta interfejsu.
- Aplikacja laczy frontend, backend, baze danych, logowanie uzytkownika, API, walidacje i testy.
- Glowny problem, ktory rozwiazuje aplikacja, to uporzadkowanie wielu typow informacji roboczych w jednym miejscu.

## Slajd 2 - Cel i zakres aplikacji

Cel slajdu:

- Wyjasnic, co aplikacja robi z perspektywy uzytkownika.

Tresci na slajdzie:

- Tworzenie i zarzadzanie notatkami.
- Tworzenie i zarzadzanie zadaniami.
- Tworzenie checklist.
- Organizowanie projektow.
- Przypinanie waznych elementow do dashboardu.
- Zapisywanie preferencji wygladu uzytkownika.

Notatki do omowienia:

- Uzytkownik po zalogowaniu moze pracowac na kilku typach danych: notatkach, taskach, checklistach i projektach.
- Dashboard pelni role centrum aplikacji. Nie jest osobna encja, tylko widok agregujacy najwazniejsze dane.
- Preferencje wygladu sa zapisywane per uzytkownik, wiec aplikacja pamieta wybrany tryb i kolory.

## Slajd 3 - Stos technologiczny

Cel slajdu:

- Pokazac wszystkie glowne technologie uzyte w projekcie i ich role.

Tresci na slajdzie:

- Next.js 14 - framework aplikacji.
- React - budowa interfejsu.
- TypeScript - typowanie kodu.
- Tailwind CSS - stylowanie UI.
- NextAuth - logowanie i sesja.
- OAuth Google/GitHub - zewnetrzne logowanie.
- MongoDB - baza dokumentowa.
- Mongoose - modele danych.
- Zod - walidacja requestow.
- Vitest - testy.
- Lucide React - ikony.

Notatki do omowienia:

- Next.js 14 z App Routerem odpowiada jednoczesnie za strony aplikacji i endpointy API.
- React sluzy do budowania komponentow UI, np. formularzy, paneli szczegolow i dashboardu.
- TypeScript pozwala ograniczyc bledy przez typowanie danych, propsow komponentow i struktur domenowych.
- Tailwind CSS pozwala szybko tworzyc spojny interfejs przez klasy narzedziowe.
- NextAuth obsluguje proces logowania, callbacki OAuth i sesje uzytkownika.
- MongoDB przechowuje dane jako dokumenty, co dobrze pasuje do notatek, zadan i projektow.
- Mongoose jest ODM dla MongoDB. Definiuje schematy dokumentow, typy pol, indeksy i walidacje po stronie modelu.
- Zod waliduje dane przychodzace do endpointow API zanim zostana zapisane w bazie.
- Vitest sluzy do testow helperow i route handlerow.
- Lucide React dostarcza ikony uzywane w przyciskach i widokach aplikacji.

## Slajd 4 - Architektura aplikacji

Cel slajdu:

- Pokazac, ze aplikacja jest zbudowana modulowo i ma rozdzielone odpowiedzialnosci.

Tresci na slajdzie:

- `src/app` - routing, strony i API.
- `src/app/api` - backend aplikacji.
- `src/components` - komponenty interfejsu.
- `src/lib` - infrastruktura i logika pomocnicza.
- `src/models` - modele Mongoose.
- `src/types` - typy domenowe.

Notatki do omowienia:

- Aplikacja jest budowana modulowo. Oznacza to, ze modele, endpointy API, komponenty UI i warstwa sesji sa rozdzielone.
- `src/app/dashboard` zawiera chronione strony widoczne po zalogowaniu.
- `src/app/api` zawiera endpointy CRUD dla notatek, zadan, checklist, projektow, pinow i preferencji.
- `src/components` jest podzielone domenowo, np. `notes`, `tasks`, `checklists`, `projects`, `dashboard`, `layout`, `theme`.
- `src/lib` zawiera m.in. konfiguracje NextAuth, polaczenie z MongoDB, pobieranie aktualnego uzytkownika, walidacje, rate limiting i obsluge realtime.
- `src/models` przechowuje modele danych, ktore definiuja strukture dokumentow w bazie.

## Slajd 5 - Przeplyw danych w aplikacji

Cel slajdu:

- Wyjasnic droge od akcji uzytkownika do zapisu w bazie danych.

Tresci na slajdzie:

- Uzytkownik wykonuje akcje w UI.
- Komponent wysyla request przez `fetch`.
- Endpoint API sprawdza sesje.
- Dane sa walidowane i sanitizowane.
- Model Mongoose zapisuje dokument w MongoDB.
- Aplikacja odswieza widok.

Notatki do omowienia:

- Przykladowo: uzytkownik tworzy notatke w formularzu.
- Formularz wysyla `POST /api/notes`.
- Endpoint pobiera ID aktualnego uzytkownika przez sesje.
- Payload przechodzi walidacje Zod i sanitizacje.
- Dokument jest tworzony przez model `Note`.
- Po zapisie powstaje zdarzenie aktywnosci, a UI moze zostac odswiezony.

## Slajd 6 - Logowanie OAuth

Cel slajdu:

- Wyjasnic, jak dziala logowanie i dlaczego aplikacja nie przechowuje hasel.

Tresci na slajdzie:

- Logowanie przez Google i GitHub.
- NextAuth jako centralna warstwa autoryzacji.
- Wlasna strona `/login`.
- Providerzy aktywowani przez zmienne srodowiskowe.

Notatki do omowienia:

- OAuth polega na tym, ze aplikacja przekierowuje uzytkownika do zaufanego providera, np. Google albo GitHub.
- Uzytkownik loguje sie u providera, a aplikacja dostaje potwierdzenie tozsamosci.
- W kodzie uzyte sa `GoogleProvider` i `GitHubProvider`.
- Klikniecie przycisku logowania uruchamia `signIn(provider.id, { callbackUrl: "/dashboard" })`.
- `callbackUrl` oznacza adres, na ktory uzytkownik wraca po udanym logowaniu.
- Endpoint `/api/auth/[...nextauth]` tworzy handler przez `NextAuth(authOptions)`.

## Slajd 7 - Sesja JWT i ochrona stron

Cel slajdu:

- Pokazac, jak aplikacja rozpoznaje zalogowanego uzytkownika.

Tresci na slajdzie:

- Strategia sesji: `jwt`.
- `getServerSession(authOptions)`.
- `session.user.id`.
- Przekierowanie niezalogowanych do `/login`.

Notatki do omowienia:

- JWT to podpisany token przechowywany w cookie.
- W aplikacji ustawiono `session: { strategy: "jwt" }`.
- `getServerSession(authOptions)` to funkcja NextAuth, ktora po stronie serwera sprawdza aktualna sesje.
- Callback sesji dopisuje `session.user.id` na podstawie `token.sub`.
- `session.user.id` jest pozniej uzywane jako identyfikator wlasciciela danych.
- Jesli uzytkownik nie ma sesji, chronione strony wykonuja `redirect("/login")`, a API zwraca `401 Unauthorized`.

## Slajd 8 - Model bazy danych

Cel slajdu:

- Pokazac, jakie kolekcje tworza baze danych aplikacji.

Tresci na slajdzie:

- `users`, `accounts` - dane NextAuth.
- `notes` - notatki.
- `tasks` - zadania.
- `checklists` - checklisty.
- `projects` - projekty.
- `pins` - przypiecia dashboardu.
- `userpreferences` - ustawienia uzytkownika.
- `activityevents` - zdarzenia aktywnosci.

Notatki do omowienia:

- Baza jest dokumentowa, wiec dane sa przechowywane jako dokumenty MongoDB.
- Wiekszosc dokumentow ma `ownerId`, ktory wskazuje wlasciciela.
- Preferencje uzytkownika uzywaja pola `userId`.
- Szczegolowy opis kolekcji i pol znajduje sie w `docs/database-design.md`.

## Slajd 9 - Mongoose jako ODM

Cel slajdu:

- Wyjasnic, czym jest Mongoose i po co jest uzywany.

Tresci na slajdzie:

- Mongoose = ODM dla MongoDB.
- Modele w `src/models`.
- Schematy dokumentow.
- Walidacja i indeksy.
- Operacje na bazie przez modele.

Notatki do omowienia:

- Mongoose nie jest klasycznym ORM, tylko ODM, bo pracuje z dokumentami MongoDB, a nie z tabelami relacyjnymi.
- Modele definiuja, jakie pola ma dokument, jakie sa typy tych pol i jakie wartosci domyslne sa ustawiane.
- Przykladowe modele: `Note`, `Task`, `Checklist`, `Project`, `Pin`, `UserPreference`, `ActivityEvent`.
- Endpointy API uzywaja metod Mongoose takich jak `find`, `create`, `findOneAndUpdate`, `findOneAndDelete`.
- Dzieki modelom backend pracuje na uporzadkowanych strukturach zamiast na przypadkowych obiektach JSON.

## Slajd 10 - CRUD w glownych modulach

Cel slajdu:

- Pokazac, ze aplikacja ma pelne operacje na danych.

Tresci na slajdzie:

- Notatki: lista, szczegoly, tworzenie, edycja, usuwanie.
- Zadania: lista, szczegoly, tworzenie, edycja, usuwanie.
- Checklisty: lista, szczegoly, tworzenie, edycja, usuwanie.
- Projekty: lista, szczegoly, tworzenie, edycja, usuwanie.
- Piny: przypinanie, odpinanie, odczyt, aktualizacja pozycji.
- Preferencje: odczyt i zapis ustawien.

Notatki do omowienia:

- CRUD jest realizowany przez endpointy w `src/app/api`.
- Interfejs uzytkownika znajduje sie w podstronach `src/app/dashboard`.
- Formularze tworzenia i edycji komunikuja sie z API przez `fetch`.
- Kazda operacja domenowa jest ograniczona do danych aktualnego uzytkownika.
- Notatki sa obecnie usuwane fizycznie z bazy przez `findOneAndDelete`.
- Inne encje uzywaja pola `archivedAt`, zeby ukryc usuniete elementy bez natychmiastowego kasowania dokumentu.

## Slajd 11 - Dashboard i przypiete elementy

Cel slajdu:

- Wyjasnic role dashboardu jako glownego widoku aplikacji.

Tresci na slajdzie:

- Dashboard agreguje najwazniejsze informacje.
- Przypiete elementy: notatki, zadania, checklisty, projekty.
- Kolekcja `pins`.
- Wspolny mechanizm dla wielu typow danych.

Notatki do omowienia:

- Dashboard nie przechowuje kopii notatek czy zadan.
- Kolekcja `pins` zapisuje tylko `targetType`, `targetId`, `ownerId` i `position`.
- Na podstawie typu i identyfikatora aplikacja doczytuje wlasciwy dokument.
- To pozwala jednym mechanizmem przypinac rozne typy elementow.

## Slajd 12 - Interfejs uzytkownika

Cel slajdu:

- Pokazac, jak zorganizowano UI i jakie funkcje sa dostepne z poziomu stron.

Tresci na slajdzie:

- Sidebar i wspolny layout `AppShell`.
- Listy z wyszukiwaniem, filtrowaniem i sortowaniem.
- Karty elementow.
- Formularze tworzenia i edycji.
- Panele szczegolow z akcjami `Edit`, `Pin`, `Delete`.

Notatki do omowienia:

- `AppShell` zapewnia wspolny uklad po zalogowaniu.
- Listy notatek, zadan, checklist i projektow maja spojny wyglad.
- Elementy mozna otworzyc w widoku szczegolow.
- Widok szczegolow pozwala edytowac, przypinac i usuwac element.
- UI jest stylowany przez Tailwind CSS i korzysta z ikon Lucide React.

## Slajd 13 - Personalizacja wygladu

Cel slajdu:

- Omowic zapis ustawien uzytkownika.

Tresci na slajdzie:

- Tryb: `light`, `dark`, `system`.
- Kolory akcentu i dashboardu.
- Zapisane motywy uzytkownika.
- Kolekcja `userpreferences`.

Notatki do omowienia:

- Ustawienia sa zapisywane per uzytkownik.
- `ColorThemeSettings` wysyla dane do `/api/user-preferences`.
- `ThemeProvider` aplikuje wybrane kolory jako zmienne CSS.
- `colorMode` odpowiada za jasny/ciemny/systemowy tryb aplikacji.
- `colors` odpowiada za akcenty i kolory kafelkow dashboardu.

## Slajd 14 - Walidacja i bezpieczenstwo API

Cel slajdu:

- Pokazac mechanizmy zabezpieczajace dane i requesty.

Tresci na slajdzie:

- Sesja sprawdzana przed operacjami.
- Filtrowanie po `ownerId`.
- Walidacja Zod.
- Sanitizacja payloadow.
- Rate limiting.
- Statusy bledow: `400`, `401`, `404`, `429`.

Notatki do omowienia:

- Endpointy najpierw sprawdzaja, czy uzytkownik jest zalogowany.
- Dokumenty sa pobierane i modyfikowane z warunkiem `ownerId`.
- Zod pilnuje ksztaltu requestu, np. wymaganych pol i typow danych.
- Sanitizacja usuwa pola techniczne, ktorych klient nie powinien ustawic samodzielnie.
- Rate limiting ogranicza liczbe wybranych mutacji w krotkim czasie.
- `400` oznacza bledny request, `401` brak sesji, `404` brak zasobu, `429` zbyt wiele requestow.

## Slajd 15 - Realtime i zdarzenia aktywnosci

Cel slajdu:

- Wyjasnic mechanizm odswiezania widokow po zmianach.

Tresci na slajdzie:

- Kolekcja `activityevents`.
- Endpoint `/api/realtime`.
- Server-Sent Events.
- `EventSource` po stronie klienta.

Notatki do omowienia:

- Po operacjach CRUD aplikacja zapisuje zdarzenie aktywnosci.
- Zdarzenie zawiera m.in. `ownerId`, `entityType`, `entityId`, `action` i `occurredAt`.
- Endpoint `/api/realtime` streamuje zdarzenia do klienta.
- Klient uzywa `EventSource`, a po wykryciu zmian odswieza widok.

## Slajd 16 - Testy i weryfikacja techniczna

Cel slajdu:

- Pokazac, jak sprawdzono poprawnosc projektu.

Tresci na slajdzie:

- `npm run typecheck`.
- `npm run build`.
- `npm run test`.
- Vitest: testy helperow i endpointow notatek.

Notatki do omowienia:

- `typecheck` sprawdza zgodnosc typow TypeScript.
- `build` sprawdza, czy aplikacja kompiluje sie jako projekt Next.js.
- `test` uruchamia testy Vitest.
- Testy obejmuja m.in. sanitizacje mutacji, walidacje danych notatek oraz zachowanie endpointow notatek.
- Konfiguracja Vitest obsluguje alias `@`, zeby testy importowaly pliki tak samo jak aplikacja.

## Slajd 17 - Scenariusz demonstracji

Cel slajdu:

- Przygotowac logiczna kolejnosc pokazu aplikacji.

Tresci na slajdzie:

- Logowanie przez OAuth.
- Dashboard.
- Utworzenie notatki.
- Edycja zadania/checklisty/projektu.
- Przypiecie elementu do dashboardu.
- Zmiana ustawien wygladu.

Notatki do omowienia:

- Najlepsza kolejnosc demo: `/login`, `/dashboard`, `/dashboard/notes`, `/dashboard/tasks`, `/dashboard/checklists`, `/dashboard/projects`, `/dashboard/settings`.
- W trakcie demo warto podkreslac, ze kazda operacja dziala w kontekscie zalogowanego uzytkownika.
- Dobrym przykladem pelnego przeplywu jest: stworzenie notatki, otwarcie szczegolow, edycja, przypiecie do dashboardu i usuniecie.

## Slajd 18 - Wnioski i mozliwosci rozwoju

Cel slajdu:

- Podsumowac wykonany zakres i wskazac dalszy rozwoj.

Tresci na slajdzie:

- Zrealizowano aplikacje full-stack.
- Wdrozone logowanie, sesja, API, baza danych i UI.
- Glowne encje maja CRUD.
- Dane sa izolowane per uzytkownik.
- Projekt mozna rozwijac o testy E2E, rozbudowany Kanban i monitoring.

Notatki do omowienia:

- Najwazniejszym efektem pracy jest dzialajacy przeplyw od logowania do zapisu danych w bazie.
- Aplikacja ma modularna strukture, co ulatwia dalszy rozwoj.
- Mozliwe kierunki rozwoju to testy end-to-end, lepszy monitoring, rozbudowa Kanbana, kontrolowany upgrade zaleznosci i bardziej zaawansowane realtime.

## Krotka lista technologii do zapamietania

- Next.js 14 - framework full-stack dla React.
- React - komponentowy interfejs uzytkownika.
- TypeScript - statyczne typowanie.
- Tailwind CSS - stylowanie aplikacji.
- NextAuth - uwierzytelnianie i sesja.
- OAuth - logowanie przez Google i GitHub.
- MongoDB - dokumentowa baza danych.
- Mongoose - ODM i modele dokumentow.
- Zod - walidacja danych requestow.
- Vitest - testy.
- Lucide React - ikony UI.
- Server-Sent Events - realtime przez `/api/realtime`.
- JWT - strategia sesji.
