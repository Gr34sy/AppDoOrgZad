# Prezentacja na obronę

Założenie: interfejs graficzny aplikacji zostanie pokazany na żywo, więc prezentacja nie musi zawierać screenshotów ekranów aplikacji. Slajdy powinny prowadzić komisję przez problem, wymagania, podstawy technologiczne i architekturę systemu. W prezentacji warto zamieścić diagramy pokazujące przepływ danych w aplikacji.

## Slajd 1. Tytuł pracy

- Tytuł: `Aplikacja do Organizacji Zadań`.
- Autor: Piotr Słupski.
- Numer albumu.
- Promotor.
- Kierunek i uczelnia.

## Slajd 2. Problem i motywacja

- Użytkownicy często zapisują zadania, notatki, checklisty i większe projekty w wielu osobnych miejscach.
- Rozproszenie informacji utrudnia szybki powrót do najważniejszych elementów.
- Istniejące narzędzia, takie jak Trello, Asana i ClickUp, bywają zbyt rozbudowane dla pojedynczego użytkownika.
- Celem było przygotowanie prostszej aplikacji do indywidualnej organizacji pracy.

## Slajd 3. Cel pracy

- Zaprojektowanie i wykonanie aplikacji internetowej do organizacji zadań.
- Obsługa tasków, checklist, notatek i projektów.
- Możliwość przypinania najważniejszych elementów do dashboardu.
- Możliwość pracy z projektem w widoku listy oraz tablicy Kanban.
- Przygotowanie architektury, bazy danych, implementacji i testów.

## Slajd 4. Zakres pracy

- Analiza wymagań.
- Omówienie podobnych aplikacji.
- Dobór technologii.
- Projekt architektury aplikacji.
- Projekt struktury bazy danych.
- Implementacja frontendu i backendu.
- Implementacja autoryzacji.
- Testy jednostkowe wybranych mechanizmów.

## Slajd 5. Najważniejsze wymagania funkcjonalne

- Logowanie przez zewnętrznego dostawcę.
- Tworzenie, edycja, pobieranie i archiwizacja elementów.
- Obsługa tasków, projektów, checklist i notatek.
- Przypinanie elementów do dashboardu.
- Łączenie notatek z innymi elementami.
- Widok Kanban w projekcie.
- Filtrowanie i wyszukiwanie danych.

## Slajd 6. Wymagania niefunkcjonalne

- Czytelny i responsywny interfejs.
- Ograniczenie dostępu użytkownika wyłącznie do własnych danych.
- Walidacja danych wejściowych.
- Możliwość dalszej rozbudowy aplikacji.
- Spójność struktury danych i komponentów.
- Podstawowe testy zabezpieczające przed regresją.

## Slajd 7. Podobne aplikacje

- Trello: prosty model tablicy Kanban.
- Asana: bardziej formalne zarządzanie projektami zespołowymi.
- ClickUp: duża liczba funkcji i wysoka elastyczność.
- Własna aplikacja: skupienie na indywidualnym użytkowniku i prostym przepływie pracy.

## Slajd 8. Podstawy technologiczne frontendu

- React jako biblioteka do budowania interfejsu z komponentów.
- TypeScript jako warstwa kontroli typów.
- Tailwind CSS jako narzędzie do stylowania komponentów.
- Komponenty wielokrotnego użytku: formularze, karty, listy, dashboard i tablica Kanban.

## Slajd 9. Podstawy technologiczne backendu

- Next.js jako framework łączący frontend i backend w jednym projekcie.
- Route Handlers jako endpointy API.
- Operacje `GET`, `POST`, `PATCH`, `DELETE`.
- Wspólne funkcje pomocnicze do walidacji, autoryzacji i odpowiedzi błędów.

## Slajd 10. Autentykacja i autoryzacja

- Logowanie przez Google i GitHub.
- Wykorzystanie Auth.js/NextAuth.
- Sesja JWT.
- Adapter MongoDB do zapisu danych kont użytkowników.
- Sprawdzanie `ownerId` przy operacjach na danych.

## Slajd 11. Baza danych

- MongoDB jako dokumentowa baza danych.
- Mongoose jako warstwa modeli i schematów.
- Najważniejsze kolekcje: `tasks`, `projects`, `checklists`, `notes`, `pins`, `userpreferences`, `activityevents`.
- Powiązania przez `ObjectId`.
- Miękka archiwizacja przez `archivedAt`.

## Slajd 12. Ogólna architektura aplikacji

- Tu warto dodać diagram warstw aplikacji.
- Przeglądarka użytkownika.
- Frontend.
- Backend/API.
- Baza danych.
- Dostawcy OAuth.
- Krótko opisać odpowiedzialność każdej warstwy.

## Slajd 13. Diagram komponentów aplikacji

- Tu warto dodać diagram komponentów aplikacji do zarządzania zadaniami.
- Pokazać połączenie między UI, Route Handlers, Auth.js, MongoDB i modelami danych.
- Wyjaśnić, że Next.js obsługuje zarówno widoki, jak i endpointy API.

## Slajd 14. Diagram przepływu danych poziomu 0

- Tu warto dodać diagram DFD poziomu 0.
- Pokazać system jako jeden proces.
- Omówić wejścia i wyjścia: użytkownik, logowanie, dane aplikacji, baza danych.

## Slajd 15. Diagram przepływu danych poziomu 1

- Tu warto dodać diagram DFD poziomu 1.
- Pokazać rozbicie systemu na główne procesy.
- Omówić zarządzanie elementami, autoryzację, zapis danych i odczyt danych.

## Slajd 16. Schemat bazy danych

- Tu warto dodać graficzny schemat bazy danych.
- Omówić najważniejsze kolekcje: `accounts`, `projects`, `tasks`, `checklists`, `pins`.
- Wyjaśnić, że schemat ma charakter dokumentowy/Mongoose, a nie klasyczny relacyjny ERD.
- Wskazać przykładowe relacje przez identyfikatory.

## Slajd 17. Najważniejsze mechanizmy aplikacji

- Przypinanie elementów do dashboardu.
- Przypisywanie tasków do projektów.
- Widok Kanban oparty na `statusId`.
- Walidacja danych przez Zod.
- Archiwizacja zamiast fizycznego usuwania.
- Zdarzenia aktywności wspierające odświeżanie danych.

## Slajd 18. Testy

- Testy uruchamiane przez `npm test`.
- Vitest jako narzędzie testowe.
- Testy walidacji tasków.
- Testy endpointów API.
- Mockowanie zależności takich jak modele i połączenie z bazą.
- Ograniczenia: brak pełnych testów end-to-end.

## Slajd 19. Demonstracja aplikacji

- Ten slajd może być tylko przejściem do pokazu live.
- Pokazać logowanie.
- Pokazać dashboard i przypięte elementy.
- Pokazać utworzenie taska.
- Pokazać projekt i tablicę Kanban.
- Pokazać checklistę lub notatkę.

## Slajd 20. Podsumowanie

- Cel pracy został osiągnięty: powstała działająca aplikacja internetowa.
- Aplikacja łączy taski, checklisty, notatki i projekty w jednym systemie.
- Zastosowano autoryzację, walidację, modele danych i testy.
- Projekt można dalej rozwijać o współdzielenie projektów, powiadomienia, PWA i testy end-to-end.

## Slajd 21. Pytania

- Krótki slajd końcowy.
- Można zostawić tytuł pracy i dane autora.
- Nie dodawać zbyt wielu informacji, żeby komisja skupiła się na rozmowie.
