# Powtorka kodu przed obrona

## Plan czasowy
1. Przeglad wszystkich funkcjonalnosci projektu - okolo 5 minut.
2. Dashboard, przypinanie, filtrowanie i sortowanie - okolo 4-5 minut.
3. Tworzenie i edycja notatki - okolo 3 minut.
4. Tworzenie i edycja checklisty - okolo 4 minut.
5. Podsumowanie - okolo 1 minuty.

# Czesc I. Gotowa wypowiedz podczas demonstracji

Podane czasy obejmuja wypowiedz i obsluge aplikacji. Wprowadzenie jest czescia pieciominutowego przegladu funkcjonalnosci, dlatego nie stanowi osobnej pozycji planu.

## 1. Przeglad wszystkich funkcjonalnosci projektu - okolo 5 minut

### 1.1. Krotkie wprowadzenie - okolo 40 sekund

**Dzialanie:** Otworz dashboard. Sidebar powinien byc rozwiniety.

**Wypowiedz:**

> Przedstawiona aplikacja sluzy do organizacji zadan oraz informacji zwiazanych z ich realizacja. Uzytkownik moze tworzyc taski, checklisty, notatki i projekty, a nastepnie laczyc je ze soba. Pozwala to przejsc od prostej notatki do projektu zarzadzanego za pomoca tablicy Kanban bez korzystania z kilku niezaleznych narzedzi.
>
> Po lewej stronie znajduje sie wspolna nawigacja, a centralna czesc widoku zmienia sie zaleznie od wybranego modulu. Dostep do danych jest chroniony sesja uzytkownika utworzona po zalogowaniu przez zewnetrznego dostawce OAuth.

### 1.2. Nawigacja i glowne typy elementow - okolo 50 sekund

**Dzialanie:** Wskaz pozycje Dashboard, Tasks, Checklists, Notes, Projects, Archive i Settings. Nie otwieraj jeszcze formularzy.

**Wypowiedz:**

> Aplikacja zostala podzielona na glowne moduly widoczne w sidebarze. Dashboard stanowi ekran startowy i agreguje najwazniejsze informacje. Task jest podstawowym elementem reprezentujacym zadanie. Checklista sklada sie z mniejszych czynnosci, ktore mozna kolejno oznaczac jako wykonane. Notatki sluza do przechowywania swobodnej tresci i moga zostac powiazane z innymi elementami. Projekty grupuja taski i checklisty oraz udostepniaja widok Kanban. Osobny modul Archive przechowuje elementy zarchiwizowane, a Settings odpowiada za wyglad aplikacji.
>
> Na stronach list dostepne sa wspolne mechanizmy wyszukiwania, filtrowania i sortowania. Elementy mozna takze ustawiac we wlasnej kolejnosci przez drag and drop, a podobne operacje zachowuja sie jednakowo w poszczegolnych modulach.

### 1.3. Taski i relacje - okolo 50 sekund

**Dzialanie:** Otworz strone Tasks, pokaz kafelki i kontrolki wyszukiwania. Otworz jeden przygotowany task, ale nie edytuj go szczegolowo.

**Wypowiedz:**

> Task zawiera tytul, opis, priorytet, termin, status, tagi oraz opcjonalne powiazanie z projektem. Moze tez zawierac podlaczone checklisty. Najwazniejsze pola, tytul i opis mozna edytowac bezposrednio w widoku szczegolow.
>
> Istotnym elementem jest zachowanie kontekstu nawigacji. Jezeli task zostal otwarty z projektu albo z tablicy Kanban, przycisk Back oraz przekierowanie po archiwizacji prowadza do poprzedniego widoku, a nie zawsze do glownej listy taskow.

### 1.4. Projekty i Kanban - okolo 1 minuty i 50 sekund

**Dzialanie:** Otworz przygotowany projekt. Pokaz informacje projektu, sekcje checklist i tablice Kanban. Przeciagnij jeden task w obrebie kolumny, drugi pomiedzy kolumnami, a nastepnie przestaw dwie kolumny.

**Wypowiedz:**

> Projekt grupuje zadania dotyczace wspolnego celu. Taski mozna przedstawic jako liste albo tablice Kanban. Kolumny maja wlasne nazwy, kolory i kolejnosc; mozna je dodawac, edytowac, przestawiac oraz usuwac.
>
> Przeniesienie taska do innej kolumny zmienia jego status, natomiast przeniesienie w pionie aktualizuje pozycje w kolumnie. Linia pomocnicza wskazuje miejsce wstawienia, a wynik operacji zostaje zapisany w bazie danych.
>
> Nad tablica znajduje sie sekcja checklist powiazanych z projektem. Checkliste mozna rozwinac i obslugiwac bez opuszczania widoku projektu. Mozna zmieniac stan jej elementow, edytowac ich nazwy, dodawac nowe pozycje i zmieniac kolejnosc. Pozostaje ona jednoczesnie samodzielnym dokumentem w bazie.

### 1.5. Archiwum i ustawienia - okolo 50 sekund

**Dzialanie:** Krotko otworz Archive, a nastepnie Settings. Pokaz akcje przywracania i trwalego usuwania bez ich zatwierdzania. W ustawieniach zmien motyw i wroc do poprzedniego.

**Wypowiedz:**

> Standardowe usuniecie elementu oznacza archiwizacje. Dokument znika z aktywnych list, ale w archiwum mozna go przywrocic albo usunac trwale. Obie operacje wymagaja potwierdzenia, co ogranicza ryzyko przypadkowej utraty danych.
>
> Aplikacja obsluguje motyw jasny, ciemny i systemowy. Dostepne sa motywy domyslne oraz motywy utworzone przez uzytkownika. Kolory sa zapisywane jako preferencje uzytkownika i przekazywane do interfejsu przez zmienne CSS, dlatego zmiana jest widoczna w calej aplikacji.

## 2. Dashboard, przypinanie, filtrowanie i sortowanie - okolo 4-5 minut

**Dzialanie:** Wroc do dashboardu.

**Wypowiedz:**

> Dashboard jest ekranem zbiorczym aplikacji. Jego pierwsza czesc zawiera skroty Quick create, dzieki ktorym mozna od razu przejsc do utworzenia taska, checklisty, notatki albo projektu. Ponizej znajduja sie liczniki poszczegolnych typow elementow oraz kalendarz oparty na terminach zapisanych w taskach i projektach. Najechanie na licznik pozwala szybko podejrzec ostatnio aktualizowane elementy.
>
> Glowna czesc dashboardu jest przeznaczona na elementy przypiete przez uzytkownika. Przypiecie nie kopiuje obiektu. W bazie powstaje osobny dokument Pin zawierajacy typ i identyfikator elementu docelowego. Dzieki temu na jednej tablicy moga wystepowac rozne typy danych, natomiast oryginalne notatki, checklisty, taski i projekty nadal pozostaja w swoich kolekcjach.

### 2.1. Przypinanie elementu

**Dzialanie:** Otworz przygotowana notatke albo checkliste. Kliknij Pin. Wroc do dashboardu i wskaz nowy element. Nastepnie mozesz pokazac Unpin.

**Wypowiedz:**

> Kazdy element, ktory moze byc przypiety, ma przycisk Pin w widoku szczegolow. Po przypieciu serwer zapisuje odniesienie do elementu, a dashboard pobiera dokumenty pinow nalezace do aktualnego uzytkownika i uzupelnia je danymi obiektow docelowych. Przycisk zmienia stan na Unpin, dlatego ta sama kontrolka obsluguje obie operacje.
>
> Piny mozna rowniez ustawiac metoda drag and drop. Pole position przechowuje kolejnosc wybrana przez uzytkownika. Jest to domyslny sposob prezentacji elementow, dopoki uzytkownik nie wybierze innego sortowania.

### 2.2. Wyszukiwanie i filtrowanie

**Dzialanie:** Wpisz fragment tytulu przypietego elementu. Nastepnie wyczysc tekst, wybierz typ, np. Checklists, i pokaz filtr Relation: Linked, Linked to Project, Linked to Task oraz Not Linked.

**Wypowiedz:**

> Wyszukiwanie dziala na biezaco, dlatego nie wymaga przycisku Apply. Wpisanie fragmentu tytulu natychmiast ogranicza zestaw wynikow. Ponizej znajduja sie filtry charakterystyczne dla dashboardu. Pierwszy pozwala wybrac rodzaj elementu, a filtr Relation rozroznia elementy niepowiazane, dowolnie powiazane, powiazane z projektem oraz powiazane z taskiem.
>
> Projekty nie sa ukrywane przez filtr relacji, poniewaz w modelu aplikacji sa elementami nadrzednymi i same nie sa podpinane do innych projektow lub taskow. Przycisk Reset przywraca wartosci domyslne wszystkich kontrolek, lacznie z wyszukiwanym tekstem.

### 2.3. Sortowanie

**Dzialanie:** Pokaz opcje sortowania. Wybierz tytul albo date aktualizacji, zmien Ascending/Descending, a na koncu wybierz User's Order.

**Wypowiedz:**

> Elementy mozna sortowac wedlug dostepnych cech, na przyklad tytulu lub daty aktualizacji. Dla takich kryteriow mozna wybrac kierunek rosnacy albo malejacy. Opcja User's Order korzysta natomiast z pozycji zapisanej podczas drag and drop, dlatego kontrolka kierunku sortowania znika - odwrocenie kolejnosci nie mialoby tu znaczenia zgodnego z intencja uzytkownika.
>
> Ten sam podstawowy komponent kontrolek jest wykorzystywany na stronach notatek, checklist, taskow i projektow. Dashboard rozszerza go jedynie o filtry typu elementu, poniewaz prezentuje dane z kilku kolekcji jednoczesnie.

## 3. Tworzenie i edycja notatki - okolo 3 minut

### 3.1. Utworzenie notatki

**Dzialanie:** Uzyj Quick create lub przycisku `+ New` na stronie Notes. Wpisz przygotowany tytul, krotka tresc i dwa tagi. Utworz notatke.

**Wypowiedz:**

> Notatka jest najprostszym elementem aplikacji i sluzy do szybkiego zapisania informacji. Formularz zawiera wymagany tytul, opcjonalna tresc oraz tagi. Tagi mozna dynamicznie dodawac i usuwac. Przed wyslaniem dane sa normalizowane, czyli usuwane sa puste tagi i zbedne spacje.
>
> Po zatwierdzeniu formularz wysyla zadanie POST do endpointu notatek. Backend sprawdza sesje, waliduje dane i zapisuje dokument z identyfikatorem wlasciciela. Odpowiedz zawiera identyfikator nowej notatki, dlatego aplikacja moze od razu przejsc do jej widoku szczegolow zamiast wracac do ogolnej listy.

### 3.2. Edycja inline i powiazania

**Dzialanie:** Kliknij tytul, zmien go i zakoncz edycje Enterem. Kliknij tresc i dopisz zdanie. Edytuj tagi. Pokaz sekcje Linked items i podlacz przygotowany task lub projekt. Zapisz zmiany.

**Wypowiedz:**

> Widok szczegolow wykorzystuje edycje inline. Tekst w trybie podgladu zmienia sie w pole dopiero po kliknieciu, przy czym zachowuje swoj rozmiar, aby interfejs nie przesuwal sie podczas edycji. Enter zatwierdza pojedyncza linie, a opuszczenie pola konczy edycje. Lokalny stan komponentu przechowuje wersje robocza, natomiast przycisk Save zapisuje komplet zmian przez zadanie PATCH.
>
> Notatke mozna powiazac z innymi elementami aplikacji. Sekcja Linked items zapisuje typ i identyfikator obiektu docelowego. Pozwala to wykorzystac notatke jako dodatkowy kontekst dla taska, checklisty lub projektu bez kopiowania jej tresci. Po zapisaniu relacja jest odtwarzana przy kolejnym pobraniu dokumentu.
>
> Z poziomu szczegolow notatke mozna przypiac do dashboardu albo przeniesc do archiwum. Jezeli widok zostal otwarty z innego miejsca aplikacji, parametr returnTo zachowuje informacje o poprzednim adresie i pozwala do niego wrocic.

## 4. Tworzenie i edycja checklisty - okolo 4 minut

### 4.1. Utworzenie checklisty

**Dzialanie:** Otworz formularz nowej checklisty. Wpisz tytul i co najmniej trzy elementy. Zmien ich kolejnosc przez drag and drop, usun jeden i dodaj go ponownie. Utworz checkliste.

**Wypowiedz:**

> Checklista sklada sie z tytulu oraz tablicy elementow. Kazdy element zawiera tresc, informacje o wykonaniu oraz pozycje. Formularz pozwala dodawac i usuwac wiersze, a kolejnosc mozna zmieniac metoda drag and drop jeszcze przed zapisaniem dokumentu.
>
> Przed wyslaniem puste wiersze sa odrzucane, a pozostale elementy otrzymuja kolejne wartosci position. Dane trafiaja do endpointu checklist przez POST. Podobnie jak w przypadku notatki, po utworzeniu aplikacja odczytuje identyfikator dokumentu i przechodzi bezposrednio do jego szczegolow.

### 4.2. Realizacja i edycja elementow

**Dzialanie:** Zaznacz i odznacz element, klikajac caly wiersz. Przenies element w inne miejsce. Uruchom edycje nazwy ikona olowka, zmien tekst i zapisz. Dodaj nowy element.

**Wypowiedz:**

> W widoku checklisty klikniecie w wiersz zmienia stan wykonania elementu. Dla istniejacych pozycji ta operacja jest zapisywana od razu, poniewaz uzytkownik oczekuje natychmiastowego zachowania statusu. Data wykonania jest ustawiana przy zaznaczeniu i usuwana przy odznaczeniu.
>
> Nazwa elementu jest edytowana dopiero po uzyciu ikony olowka. Zapobiega to przypadkowemu uruchamianiu pola podczas zaznaczania checklisty. Drag and drop nie zamienia tylko dwoch wartosci miejscami. Element jest usuwany ze starego indeksu i wstawiany w nowe miejsce, a wszystkie pozycje zostaja ponownie przeliczone.
>
> Tytul i strukturalne zmiany checklisty korzystaja z wersji roboczej oraz przycisku Save. Aplikacja porownuje stan poczatkowy z aktualnym, dzieki czemu wie, czy wystepuja niezapisane zmiany. Uzytkownik moze tez uzyc Cancel, aby przywrocic dane pobrane z serwera.

### 4.3. Checklista zagniezdzona w tasku lub projekcie

**Dzialanie:** Jezeli pozostalo wystarczajaco czasu, otworz task albo projekt z podlaczona checklista. Rozwin ja, zaznacz element, zmien kolejnosc i wskaz ikony odlaczenia oraz otwarcia pelnego widoku.

**Wypowiedz:**

> Ta sama checklista moze zostac podlaczona do taska albo projektu. W widoku zagniezdzonym zachowuje podstawowe funkcje: rozwijanie, zaznaczanie, edycje, dodawanie, usuwanie i zmiane kolejnosci. Zmiany sa zapisywane bez osobnego przycisku Save.
>
> Komponent ogranicza jednak liczbe zbednych zapytan. Wpisywanie nazwy nie wysyla zadania po kazdym znaku - zapis odbywa sie po zakonczeniu edycji. Dodatkowo zapamietywany jest ostatni zapisany stan checklisty. Jezeli dane sie nie zmienily, kolejne zadanie PATCH nie jest wykonywane.

## 5. Podsumowanie - okolo 1 minuty

**Dzialanie:** Wroc do dashboardu, aby zakonczyc prezentacje na ekranie zbiorczym.

**Wypowiedz:**

> Podsumowujac, aplikacja laczy proste elementy organizacyjne z bardziej rozbudowanym zarzadzaniem projektami. Uzytkownik moze rozpoczac od notatki lub checklisty, utworzyc task, polaczyc te dane z projektem, a nastepnie kontrolowac realizacje na tablicy Kanban. Dashboard zapewnia szybki dostep do najwazniejszych informacji, a wspolne filtrowanie, sortowanie, przypinanie i archiwizacja utrzymuja spojne zachowanie calego systemu.
>
> Od strony technicznej aplikacja laczy frontend React i Next.js z backendowymi Route Handlers oraz baza MongoDB obslugiwana przez Mongoose. Operacje sa chronione sesja uzytkownika, dane sa walidowane przed zapisem, a kluczowe formularze, endpointy i mechanizmy interfejsu zostaly objete testami automatycznymi.

---

# Czesc II. Miejsca kodu warte przejrzenia

Ponizsza lista jest celowo krotka. Kazdy temat mozna pozniej rozpisac jako osobna powtorke.

## Architektura i routing

- `src/app/layout.tsx` - glowny layout i `ThemeProvider`.
- `src/app/dashboard/layout.tsx` - wspolny `AppShell` dla dashboardu.
- `src/components/layout/app-shell.tsx` - sesja, sidebar i obszar strony.
- `src/components/dashboard/return-to-link.tsx` oraz `src/lib/return-to.ts` - zachowanie kontekstu nawigacji.

## Dashboard

- `src/app/dashboard/page.tsx` - serwerowe pobieranie metryk, pinow i terminow.
- `src/components/dashboard/pinned-board.tsx` - metryki, kalendarz i sekcja pinow.
- `src/components/dashboard/pinned-items-search.tsx` - wyszukiwanie, filtrowanie i sortowanie pinow.
- `src/components/dashboard/pin-entity-button.tsx` - przypinanie i odpinanie.
- `src/components/dashboard/quick-create-actions.tsx` - skroty tworzenia elementow.

## Wspolne listy i filtry

- `src/components/dashboard/list-controls.tsx` - wspolny searchbar i kontrolki filtrow.
- `src/lib/list-query.ts` - interpretacja parametrow listy.
- `src/lib/item-list-utils.ts` - filtrowanie i sortowanie danych.
- `src/components/dashboard/reorderable-list.tsx` - drag and drop zwyklych list.

## Notatki

- `src/components/notes/note-create-form.tsx` - formularz i zadanie POST.
- `src/components/notes/note-details-panel.tsx` - edycja inline, tagi i relacje.
- `src/app/api/notes/route.ts` - tworzenie i pobieranie notatek.
- `src/app/api/notes/[noteId]/route.ts` - aktualizacja i archiwizacja.
- `src/models/note.ts` - schemat dokumentu notatki.

## Checklisty

- `src/components/checklists/checklist-form.tsx` - tworzenie checklisty.
- `src/components/checklists/checklist-details-panel.tsx` - statusy, edycja i drag and drop.
- `src/components/checklists/linked-checklist-list.tsx` - checklista zagniezdzona i automatyczny zapis.
- `src/app/api/checklists/route.ts` oraz `src/app/api/checklists/[checklistId]/route.ts` - API checklist.
- `src/models/checklist.ts` - model checklisty i jej elementow.

## Projekty, taski i Kanban

- `src/components/projects/project-kanban-board.tsx` - drag and drop taskow i kolumn.
- `src/components/projects/project-task-view.tsx` - widok listy i Kanban.
- `src/components/tasks/task-details-panel.tsx` - edycja taska i podlaczone checklisty.
- `src/models/project.ts` oraz `src/models/task.ts` - kolumny, status i pozycja.
- `src/app/api/reorder/route.ts` - zbiorczy zapis nowej kolejnosci.

## Bezpieczenstwo i dane

- `src/lib/auth.ts` - Auth.js, OAuth i sesja.
- `src/lib/validation-schemas.ts` - schematy Zod.
- `src/lib/api-guards.ts` oraz `src/lib/session.ts` - kontrola zalogowanego uzytkownika.
- `src/lib/sanitize-mutation.ts` - blokowanie modyfikacji pol systemowych.
- `src/lib/entity-relations.ts` i `src/lib/entity-note-links.ts` - spojne relacje dokumentow.
- `src/lib/mongoose.ts` - polaczenie z MongoDB.

## Testy

- `src/components/projects/project-kanban-board.test.tsx` - drag and drop i kolumny Kanban.
- `src/components/checklists/linked-checklist-list.test.tsx` - zagniezdzone checklisty.
- `src/components/dashboard/list-controls.test.tsx` - filtry i sortowanie.
- `src/components/notes/note-create-form.test.tsx` - formularz notatki.
- `src/components/checklists/checklist-form.test.tsx` - formularz checklisty.
- `src/app/api/*/*.test.ts` - testy Route Handlers.

---

# Czesc III. Teoria do pozniejszej powtorki

## Najwyzszy priorytet

- App Router: `page.tsx`, `layout.tsx`, dynamiczne segmenty i Route Handlers.
- Roznica miedzy Server Components i Client Components.
- React: `useState`, `useEffect`, `useMemo`, props i kontrolowane formularze.
- Zadania asynchroniczne, `fetch`, `async/await` i obsluga bledow.
- Metody HTTP: GET, POST, PATCH i DELETE oraz podstawowe kody odpowiedzi.
- MongoDB i Mongoose: dokument, kolekcja, schemat, `ObjectId`, indeks i referencja.
- Walidacja Zod po stronie API oraz walidacja formularza po stronie klienta.
- Sesja, OAuth, uwierzytelnianie, autoryzacja i kontrola wlasciciela dokumentu.
- Drag and drop: zdarzenia, `dataTransfer`, indeks docelowy i zapis pola `position`.
- Relacje task-projekt, checklista-task/projekt, notatka-inny element oraz osobny model Pin.

## Sredni priorytet

- Wyszukiwanie, filtrowanie i sortowanie danych.
- Optymistyczna aktualizacja interfejsu i wycofanie stanu po bledzie API.
- Normalizacja danych przed zapisem.
- Archiwizacja miekka i trwale usuwanie.
- Parametr `returnTo` i nawigacja programowa przez `useRouter`.
- CSS variables, Tailwind CSS i obsluga motywow.
- SSE oraz odswiezanie danych przez `router.refresh()`.
- Error Boundary, `error.tsx`, `not-found.tsx` i funkcja `reset()`.

## Testowanie

- Vitest jako test runner.
- React Testing Library: `render`, `screen`, `waitFor` i `fireEvent`.
- `userEvent` jako symulacja zachowania uzytkownika.
- Mockowanie `fetch`, routera Next.js i sesji.
- JSDOM jako srodowisko testow komponentow.
- Roznica miedzy testem jednostkowym, komponentowym, integracyjnym i end-to-end.

## Pytania, na ktore trzeba umiec odpowiedziec

- Dlaczego wybrano Next.js zamiast oddzielnego frontendu i backendu?
- Dlaczego MongoDB pasuje do struktury tej aplikacji?
- Dlaczego piny sa osobna kolekcja zamiast polem w kazdym modelu?
- Jak aplikacja zabezpiecza dane jednego uzytkownika przed drugim?
- Co dzieje sie od klikniecia Create do pojawienia sie dokumentu w bazie?
- Jak zapisywana jest kolejnosc po drag and drop?
- Dlaczego zagniezdzona checklista nie wysyla PATCH po kazdym znaku?
- Jak dziala edycja inline i wykrywanie niezapisanych zmian?
- Jak dziala powrot do poprzedniego widoku po archiwizacji?
- Co obejmuja testy, a czego jeszcze nie sprawdzaja?
