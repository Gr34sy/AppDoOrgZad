# Projekt bazy danych

Aplikacja korzysta z dokumentowej bazy MongoDB. Warstwa domenowa jest opisana przez modele Mongoose w katalogu `src/models`, a logowanie OAuth jest obsługiwane przez adapter `@next-auth/mongodb-adapter`.

Najważniejsza zasada projektowa jest prosta: dokumenty domenowe należą do konkretnego użytkownika. Notatki, checklisty, zadania, projekty, przypięcia i zdarzenia aktywności mają pole `ownerId`, a preferencje użytkownika mają pole `userId`. Endpointy API wykonują operacje z warunkiem właściciela, dzięki czemu użytkownik nie może pobrać ani zmienić cudzych danych.

## Kolekcje autoryzacji

Kolekcje autoryzacyjne są tworzone przez NextAuth i adapter MongoDB.

| Kolekcja | Rola |
| --- | --- |
| `users` | Dane użytkowników utworzonych po logowaniu przez Google lub GitHub. |
| `accounts` | Powiązania użytkownika z zewnętrznym dostawcą OAuth. |
| `sessions` | Kolekcja przewidziana przez adapter; aplikacja używa strategii JWT. |
| `verification_tokens` | Tokeny weryfikacyjne obsługiwane przez adapter. |

Identyfikator z kolekcji `users` jest wykorzystywany jako `ownerId` lub `userId` w kolekcjach aplikacyjnych.

## `notes`

Kolekcja przechowuje notatki użytkownika.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel notatki, referencja do `users._id`. |
| `title` | `string` | Tytuł notatki, wymagany, maksymalnie 160 znaków. |
| `content` | `string` | Treść notatki, maksymalnie 20000 znaków. |
| `linkedItems` | `object[]` | Powiązania notatki z innymi elementami aplikacji. |
| `tags` | `string[]` | Tagi używane do filtrowania i wyszukiwania. |
| `position` | `number` | Kolejność notatki na liście. |
| `archivedAt` | `Date \| null` | Data archiwizacji; `null` oznacza aktywny dokument. |
| `createdAt`, `updatedAt` | `Date` | Znaczniki czasu dodawane automatycznie przez Mongoose. |

Element tablicy `linkedItems` zawiera `targetType` (`note`, `checklist`, `task` lub `project`) oraz `targetId`. Przy tworzeniu i edycji notatki backend sprawdza, czy wskazane obiekty istnieją i należą do tego samego użytkownika.

Indeksy:

- `{ ownerId: 1 }`
- `{ tags: 1 }`
- `{ ownerId: 1, position: 1 }`

## `checklists`

Kolekcja przechowuje checklisty samodzielne oraz checklisty przypięte do zadania lub projektu.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel checklisty. |
| `title` | `string` | Nazwa checklisty, wymagana, maksymalnie 160 znaków. |
| `items` | `object[]` | Osadzone elementy checklisty. |
| `parentType` | `string \| null` | `task`, `project` albo `null` dla checklisty samodzielnej. |
| `parentId` | `ObjectId \| null` | Identyfikator zadania lub projektu, jeśli checklista ma rodzica. |
| `position` | `number` | Kolejność checklisty. |
| `archivedAt` | `Date \| null` | Data archiwizacji. |
| `createdAt`, `updatedAt` | `Date` | Automatyczne znaczniki czasu. |

Element checklisty jest osadzony w dokumencie i ma własne `_id`.

| Pole elementu | Typ | Opis |
| --- | --- | --- |
| `title` | `string` | Treść punktu, wymagana, maksymalnie 180 znaków. |
| `isCompleted` | `boolean` | Informacja, czy punkt został ukończony. |
| `completedAt` | `Date \| null` | Data ukończenia punktu. |
| `position` | `number` | Kolejność punktu w checkliście. |

Indeksy:

- `{ ownerId: 1 }`
- `{ parentType: 1 }`
- `{ parentId: 1 }`
- `{ ownerId: 1, parentType: 1, parentId: 1, position: 1 }`

## `tasks`

Kolekcja przechowuje zadania. Zadanie może istnieć samodzielnie albo należeć do projektu.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel zadania. |
| `projectId` | `ObjectId \| null` | Projekt, do którego należy zadanie. |
| `title` | `string` | Tytuł zadania, wymagany, maksymalnie 180 znaków. |
| `description` | `string` | Opis zadania, maksymalnie 10000 znaków. |
| `priority` | `string` | `low`, `medium`, `high` albo `urgent`; domyślnie `medium`. |
| `statusId` | `string` | Status zadania lub identyfikator kolumny Kanban; domyślnie `todo`. |
| `dueDate` | `Date \| null` | Termin wykonania. |
| `tags` | `string[]` | Tagi zadania. |
| `checklistIds` | `ObjectId[]` | Checklisty powiązane z zadaniem. |
| `position` | `number` | Kolejność zadania w widoku. |
| `completedAt` | `Date \| null` | Data ukończenia. |
| `archivedAt` | `Date \| null` | Data archiwizacji. |
| `createdAt`, `updatedAt` | `Date` | Automatyczne znaczniki czasu. |

Podczas tworzenia lub edycji zadania można przekazać `newChecklists`; backend tworzy wtedy dokumenty w `checklists` z `parentType: "task"` i dopisuje ich identyfikatory do `task.checklistIds`. Można też przekazać `noteIds`; funkcja `syncEntityNoteLinks` aktualizuje wtedy `notes.linkedItems`.

Jeżeli zadanie ma `projectId`, backend sprawdza, czy projekt istnieje, nie jest zarchiwizowany i należy do użytkownika. Przy przypisaniu zadania do projektu identyfikator zadania jest dodawany do `projects.taskIds`; przy zmianie projektu lub archiwizacji zadania jest usuwany ze starego projektu.

Indeksy:

- `{ ownerId: 1 }`
- `{ projectId: 1 }`
- `{ priority: 1 }`
- `{ statusId: 1 }`
- `{ dueDate: 1 }`
- `{ tags: 1 }`
- `{ ownerId: 1, projectId: 1, statusId: 1, position: 1 }`
- `{ ownerId: 1, dueDate: 1, priority: 1 }`

## `projects`

Kolekcja przechowuje projekty użytkownika oraz konfigurację ich widoku zadań.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel projektu. |
| `title` | `string` | Tytuł projektu, wymagany, maksymalnie 180 znaków. |
| `description` | `string` | Opis projektu, maksymalnie 12000 znaków. |
| `priority` | `string` | `low`, `medium`, `high` albo `urgent`; domyślnie `medium`. |
| `lifecycleStatus` | `string` | `active`, `paused`, `completed` albo `archived`; domyślnie `active`. |
| `dueDate` | `Date \| null` | Termin projektu. |
| `tags` | `string[]` | Tagi projektu. |
| `checklistIds` | `ObjectId[]` | Checklisty powiązane z projektem. |
| `taskIds` | `ObjectId[]` | Zadania powiązane z projektem. |
| `kanbanColumns` | `object[]` | Kolumny tablicy Kanban projektu. |
| `taskView` | `string` | `kanban` albo `list`; domyślnie `kanban`. |
| `position` | `number` | Kolejność projektu. |
| `completedAt` | `Date \| null` | Data ukończenia. |
| `archivedAt` | `Date \| null` | Data archiwizacji. |
| `createdAt`, `updatedAt` | `Date` | Automatyczne znaczniki czasu. |

Kolumny Kanban są osadzone w dokumencie projektu.

| Pole kolumny | Typ | Opis |
| --- | --- | --- |
| `id` | `string` | Identyfikator statusu, używany przez `tasks.statusId`. |
| `title` | `string` | Nazwa kolumny. |
| `position` | `number` | Kolejność kolumny. |
| `color` | `string` | Kolor kolumny zapisany jako HEX. |
| `isDone` | `boolean` | Czy kolumna oznacza zakończenie zadania. |

Domyślne kolumny projektu to `backlog`, `todo`, `in_progress`, `testing` oraz `done`. Podczas tworzenia lub edycji projektu można dodać `newTasks` i `newChecklists`; backend tworzy wtedy odpowiednie dokumenty w `tasks` i `checklists`, a ich identyfikatory dopisuje do `taskIds` oraz `checklistIds`.

Indeksy:

- `{ ownerId: 1 }`
- `{ lifecycleStatus: 1 }`
- `{ dueDate: 1 }`
- `{ priority: 1 }`
- `{ tags: 1 }`
- `{ ownerId: 1, lifecycleStatus: 1, position: 1 }`
- `{ ownerId: 1, dueDate: 1, priority: 1 }`

## `pins`

Kolekcja przechowuje elementy przypięte na dashboardzie.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel przypięcia. |
| `targetType` | `string` | `note`, `checklist`, `task` albo `project`. |
| `targetId` | `ObjectId` | Identyfikator przypiętego dokumentu. |
| `position` | `number` | Kolejność przypięcia. |
| `createdAt`, `updatedAt` | `Date` | Automatyczne znaczniki czasu. |

Para `targetType` i `targetId` wskazuje właściwy dokument domenowy. Indeks unikalny `{ ownerId: 1, targetType: 1, targetId: 1 }` zapobiega wielokrotnemu przypięciu tego samego elementu przez jednego użytkownika.

Indeksy:

- `{ ownerId: 1 }`
- `{ targetType: 1 }`
- `{ targetId: 1 }`
- `{ ownerId: 1, targetType: 1, targetId: 1 }`, unikalny
- `{ ownerId: 1, position: 1 }`

## `userpreferences`

Kolekcja przechowuje preferencje wyglądu aplikacji.

| Pole | Typ | Opis |
| --- | --- | --- |
| `userId` | `ObjectId` | Użytkownik, którego dotyczą preferencje; pole jest unikalne. |
| `colorMode` | `string` | `system`, `light` albo `dark`; domyślnie `system`. |
| `dashboardLayout` | `string` | `compact` albo `comfortable`; domyślnie `comfortable`. |
| `colors` | `object` | Kolory akcentu i kafelków dashboardu. |
| `savedThemes` | `object[]` | Zapisane motywy użytkownika. |
| `createdAt`, `updatedAt` | `Date` | Automatyczne znaczniki czasu. |

Obiekt `colors` zawiera pola `accent`, `upcoming`, `todo`, `inProgress`, `completed` i `calendar`. Każdy zapisany motyw ma nazwę, zestaw kolorów oraz `createdAt`.

Indeksy:

- `{ userId: 1 }`, unikalny

## `activityevents`

Kolekcja przechowuje zdarzenia aktywności używane między innymi przez endpoint realtime.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel zdarzenia. |
| `entityType` | `string` | `note`, `checklist`, `task` albo `project`. |
| `entityId` | `ObjectId` | Identyfikator dokumentu, którego dotyczy zdarzenie. |
| `action` | `string` | `created`, `updated`, `deleted`, `moved`, `pinned` albo `unpinned`. |
| `metadata` | `object` | Dodatkowe dane zdarzenia. |
| `occurredAt` | `Date` | Czas wystąpienia zdarzenia. |
| `createdAt`, `updatedAt` | `Date` | Automatyczne znaczniki czasu. |

Endpoint `/api/realtime` odczytuje zdarzenia i przekazuje je klientowi przez SSE, dzięki czemu widoki mogą odświeżać się po zmianach.

Indeksy:

- `{ ownerId: 1 }`
- `{ entityType: 1 }`
- `{ entityId: 1 }`
- `{ action: 1 }`
- `{ occurredAt: 1 }`
- `{ ownerId: 1, occurredAt: -1 }`
- `{ ownerId: 1, entityType: 1, entityId: 1, occurredAt: -1 }`

## Relacje logiczne

MongoDB nie wymusza kluczy obcych tak jak baza relacyjna, ale aplikacja utrzymuje relacje na poziomie identyfikatorów i walidacji w endpointach.

| Relacja | Znaczenie |
| --- | --- |
| `users._id -> ownerId` | Użytkownik jest właścicielem notatek, checklist, zadań, projektów, pinów i zdarzeń. |
| `users._id -> userpreferences.userId` | Jeden użytkownik ma jeden dokument preferencji. |
| `projects._id -> tasks.projectId` | Zadanie może należeć do projektu. |
| `tasks._id -> projects.taskIds` | Projekt przechowuje pomocniczą listę zadań. |
| `checklists._id -> tasks.checklistIds` | Zadanie może mieć powiązane checklisty. |
| `checklists._id -> projects.checklistIds` | Projekt może mieć powiązane checklisty. |
| `notes.linkedItems.targetId` | Notatka może wskazywać notatkę, checklistę, zadanie albo projekt. |
| `pins.targetId` | Przypięcie wskazuje notatkę, checklistę, zadanie albo projekt. |
| `activityevents.entityId` | Zdarzenie wskazuje dokument, którego dotyczy zmiana. |

## Schemat logiczny

```txt
users
  |-- accounts
  |-- userpreferences
  |-- notes
  |     |-- linkedItems ----------> notes / checklists / tasks / projects
  |
  |-- checklists
  |     |-- parentId -------------> tasks / projects
  |
  |-- tasks
  |     |-- projectId ------------> projects
  |     |-- checklistIds ---------> checklists
  |
  |-- projects
  |     |-- taskIds --------------> tasks
  |     |-- checklistIds ---------> checklists
  |     |-- kanbanColumns.id <---- tasks.statusId
  |
  |-- pins -----------------------> notes / checklists / tasks / projects
  |-- activityevents -------------> notes / checklists / tasks / projects
```

## Archiwizacja i usuwanie

Zadania, projekty i checklisty są archiwizowane przez ustawienie `archivedAt`. Projekt przy usunięciu otrzymuje również `lifecycleStatus: "archived"`. Widoki i endpointy listujące pobierają tylko dokumenty z `archivedAt: null`.

Notatki są również modelowane z polem `archivedAt`, ale aktualny endpoint usuwania notatki usuwa dokument fizycznie. To różni notatki od pozostałych encji domenowych i warto brać to pod uwagę przy przyszłym rozwoju aplikacji.

## Uzasadnienie modelu

Model dokumentowy pasuje do aplikacji, ponieważ większość operacji dotyczy danych jednego użytkownika i jednego obszaru roboczego: listy notatek, tablicy projektu, checklisty albo dashboardu. Proste dane podrzędne, takie jak elementy checklisty i kolumny Kanban, są osadzone w dokumentach, bo są odczytywane i modyfikowane razem z obiektem nadrzędnym. Większe encje, takie jak zadania, projekty, checklisty i notatki, są osobnymi kolekcjami, ponieważ mogą być filtrowane, przypinane, linkowane i prezentowane w wielu widokach.
