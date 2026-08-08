# Screenshoty kodu do dodania do pracy

## Rozdzial 7 - Implementacja kodu po stronie frontendu

1. `src/components/projects/project-kanban-board.tsx`, okolice funkcji `orderedColumns`.
   Ujac definicje `baseColumns`, `knownColumnIds`, tworzenie `extraColumns` oraz `return [...baseColumns, ...extraColumns]`. Screenshot ma pokazac, jak komponent zabezpiecza widok kanban przed brakiem domyslnych kolumn albo przed zadaniem ze statusem spoza konfiguracji projektu.

2. `src/components/projects/project-kanban-board.tsx`, funkcja `moveTask`.
   Ujac obliczanie `nextPosition`, aktualizacje `setBoardTasks`, wyslanie zadania `PATCH` do `/api/tasks/${task.id}` oraz obsluge bledu przez przywrocenie poprzedniego stanu. Screenshot najlepiej pokazuje glowna logike przenoszenia taska miedzy kolumnami.

3. `src/components/dashboard/pinned-items-search.tsx`, okolice stanow i memoizacji filtrowania.
   Ujac `query`, `selectedTypes`, `sortField`, `sortDirection`, `selectedTypeSet`, `filteredItems` oraz poczatek `sortedItems`. Screenshot ma pokazac, jak wyszukiwarka, filtry typow i sortowanie przypietych elementow zostaly zamkniete w jednym komponencie klienckim.

4. `src/components/dashboard/pin-entity-button.tsx`, funkcja `handleToggle`.
   Ujac wybor metody `POST` albo `DELETE`, budowanie body z `targetType` i `targetId`, obsluge odpowiedzi, ustawienie `pinId` oraz `router.refresh()`. Screenshot ma pokazac wspolny mechanizm przypinania i odpinania roznych typow elementow.

## Rozdzial 8 - Implementacja kodu po stronie backendu

5. `src/app/api/checklists/route.ts`, metody `GET` i `POST`.
   Ujac pobranie `ownerId`, zwrot `unauthorizedResponse`, zapytanie `Checklist.find({ ownerId, archivedAt: null })`, walidacje przez `parseJsonBody(request, checklistCreateSchema)`, `sanitizeMutation`, `Checklist.create` oraz `recordActivityEvent`. Screenshot ma pokazac pelny przeplyw listowania i tworzenia checklist.

6. `src/app/api/checklists/[checklistId]/route.ts`, metoda `PATCH`.
   Ujac sprawdzenie sesji, `isValidObjectId`, `parseJsonBody`, `sanitizeMutation` oraz `Checklist.findOneAndUpdate` z warunkami `_id`, `ownerId` i `archivedAt: null`. Screenshot ma podkreslic walidacje oraz zabezpieczenie przed edycja cudzych lub zarchiwizowanych danych.

7. `src/app/api/checklists/[checklistId]/route.ts`, metoda `DELETE`.
   Ujac sprawdzenie `ownerId`, walidacje identyfikatora, `findOneAndUpdate` ustawiajace `archivedAt: new Date()` oraz zapis zdarzenia `recordActivityEvent` z akcja `deleted`. Screenshot ma pokazac, ze usuwanie checklist jest realizowane jako archiwizacja, a nie fizyczne kasowanie dokumentu.

8. `src/lib/auth.ts`, konfiguracja `authOptions`.
   Ujac `MongoDBAdapter(clientPromise)`, strategie sesji `jwt`, mapowanie dostawcow OAuth oraz callback `session`, ktory zapisuje `token.sub` do `session.user.id`. Screenshot ma pokazac centralna konfiguracje autoryzacji wykorzystywana przez endpoint NextAuth.
