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

## Schemat do wykonania w Lucidchart

Poniższy opis można wykorzystać jako instrukcję wykonania graficznej wizualizacji bazy danych w narzędziu Lucidchart. Diagram powinien przedstawiać strukturę dokumentowej bazy MongoDB, dlatego najlepiej użyć stylu zbliżonego do diagramu ERD, ale z dodatkowymi oznaczeniami pól osadzonych oraz relacji polimorficznych.

### 1. Przygotowanie diagramu

W Lucidchart należy utworzyć nowy diagram i wybrać kształty typu Entity Relationship albo Database. Każdą kolekcję warto przedstawić jako osobny prostokąt z trzema częściami:

1. Nazwa kolekcji.
2. Najważniejsze pola dokumentu.
3. Krótka informacja o polach osadzonych lub indeksach, jeżeli są istotne dla zrozumienia relacji.

Kolekcje aplikacyjne i kolekcje autoryzacji powinny zostać rozróżnione kolorami. Proponowany podział:

| Grupa | Kolekcje | Kolor w diagramie |
| --- | --- | --- |
| Autoryzacja | `users`, `accounts`, `sessions`, `verification_tokens` | jasny niebieski |
| Dane użytkownika | `notes`, `checklists`, `tasks`, `projects` | jasny zielony |
| Dane pomocnicze | `pins`, `userpreferences`, `activityevents` | jasny fioletowy |
| Pola osadzone | `linkedItems`, `items`, `kanbanColumns`, `savedThemes` | jasny szary albo osobna sekcja w obrębie kolekcji |

### 2. Kolekcje do umieszczenia na diagramie

Na diagramie należy umieścić następujące kolekcje:

```txt
users
accounts
sessions
verification_tokens
notes
checklists
tasks
projects
pins
userpreferences
activityevents
```

Kolekcję `users` należy umieścić centralnie po lewej stronie, ponieważ stanowi punkt wyjścia dla większości relacji właścicielskich. Kolekcje domenowe (`notes`, `checklists`, `tasks`, `projects`) najlepiej umieścić w środkowej części diagramu. Kolekcje pomocnicze (`pins`, `userpreferences`, `activityevents`) powinny znaleźć się po prawej stronie lub poniżej kolekcji domenowych.

### 3. Zawartość prostokątów kolekcji

W prostokątach nie trzeba umieszczać wszystkich pól opisowych, jeśli diagram ma pozostać czytelny. Najważniejsze są pola identyfikujące dokument, relacje i status dokumentu.

```txt
users
- _id: ObjectId
- name: string
- email: string
- image: string
```

```txt
accounts
- _id: ObjectId
- userId: ObjectId
- provider: string
- providerAccountId: string
```

```txt
notes
- _id: ObjectId
- ownerId: ObjectId
- title: string
- content: string
- linkedItems[]: object[]
- tags[]: string[]
- position: number
- archivedAt: Date | null
- createdAt: Date
- updatedAt: Date
```

```txt
checklists
- _id: ObjectId
- ownerId: ObjectId
- title: string
- items[]: object[]
- parentType: string | null
- parentId: ObjectId | null
- position: number
- archivedAt: Date | null
- createdAt: Date
- updatedAt: Date
```

```txt
tasks
- _id: ObjectId
- ownerId: ObjectId
- projectId: ObjectId | null
- title: string
- priority: string
- statusId: string
- dueDate: Date | null
- tags[]: string[]
- checklistIds[]: ObjectId[]
- position: number
- completedAt: Date | null
- archivedAt: Date | null
- createdAt: Date
- updatedAt: Date
```

```txt
projects
- _id: ObjectId
- ownerId: ObjectId
- title: string
- priority: string
- lifecycleStatus: string
- dueDate: Date | null
- tags[]: string[]
- checklistIds[]: ObjectId[]
- taskIds[]: ObjectId[]
- kanbanColumns[]: object[]
- taskView: string
- completedAt: Date | null
- archivedAt: Date | null
- createdAt: Date
- updatedAt: Date
```

```txt
pins
- _id: ObjectId
- ownerId: ObjectId
- targetType: string
- targetId: ObjectId
- position: number
- createdAt: Date
- updatedAt: Date
```

```txt
userpreferences
- _id: ObjectId
- userId: ObjectId
- colorMode: string
- dashboardLayout: string
- colors: object
- savedThemes[]: object[]
- createdAt: Date
- updatedAt: Date
```

```txt
activityevents
- _id: ObjectId
- ownerId: ObjectId
- entityType: string
- entityId: ObjectId
- action: string
- metadata: object
- occurredAt: Date
- createdAt: Date
- updatedAt: Date
```

### 4. Pola osadzone do pokazania na diagramie

W MongoDB część danych nie jest przechowywana jako osobne kolekcje, lecz jako tablice obiektów osadzone w dokumencie. W Lucidchart można pokazać je jako mniejsze prostokąty wewnątrz kolekcji albo jako szare prostokąty połączone linią kompozycji.

```txt
notes.linkedItems[]
- targetType: note | checklist | task | project
- targetId: ObjectId
```

```txt
checklists.items[]
- _id
- title
- isCompleted
- completedAt
- position
```

```txt
projects.kanbanColumns[]
- id
- title
- position
- color
- isDone
```

```txt
userpreferences.savedThemes[]
- name
- colors
- createdAt
```

Najważniejsze pola osadzone z punktu widzenia diagramu to `checklists.items[]` i `projects.kanbanColumns[]`. Pierwsze pokazuje, że elementy checklisty nie są osobną kolekcją, a drugie wyjaśnia, skąd pochodzą kolumny widoku kanban.

### 5. Relacje do narysowania

Relacje należy narysować liniami z podpisami pól, które tworzą powiązanie. Przy relacjach właścicielskich można użyć linii ciągłej, a przy relacjach polimorficznych linii przerywanej.

| Relacja w diagramie | Typ linii | Opis podpisu na linii |
| --- | --- | --- |
| `users._id -> accounts.userId` | ciągła | użytkownik ma konta OAuth |
| `users._id -> userpreferences.userId` | ciągła | użytkownik ma jedne preferencje |
| `users._id -> notes.ownerId` | ciągła | właściciel notatki |
| `users._id -> checklists.ownerId` | ciągła | właściciel checklisty |
| `users._id -> tasks.ownerId` | ciągła | właściciel taska |
| `users._id -> projects.ownerId` | ciągła | właściciel projektu |
| `users._id -> pins.ownerId` | ciągła | właściciel przypięcia |
| `users._id -> activityevents.ownerId` | ciągła | właściciel zdarzenia |
| `projects._id -> tasks.projectId` | ciągła | task należy do projektu |
| `tasks._id -> projects.taskIds[]` | ciągła | projekt przechowuje identyfikatory tasków |
| `checklists._id -> tasks.checklistIds[]` | ciągła | task ma powiązane checklisty |
| `checklists._id -> projects.checklistIds[]` | ciągła | projekt ma powiązane checklisty |
| `tasks._id / projects._id -> checklists.parentId` | przerywana | checklista może mieć rodzica |
| `projects.kanbanColumns.id -> tasks.statusId` | przerywana | status taska odpowiada kolumnie kanban |
| `notes.linkedItems.targetId -> notes/checklists/tasks/projects._id` | przerywana | notatka wskazuje różne typy elementów |
| `pins.targetId -> notes/checklists/tasks/projects._id` | przerywana | przypięcie wskazuje różne typy elementów |
| `activityevents.entityId -> notes/checklists/tasks/projects._id` | przerywana | zdarzenie dotyczy różnych typów elementów |

Relacje `pins`, `activityevents` i `notes.linkedItems` są polimorficzne, ponieważ pole `targetId` albo `entityId` może wskazywać dokument z różnych kolekcji. Na diagramie należy podpisać te linie również polem typu:

```txt
targetType / entityType:
note | checklist | task | project
```

### 6. Proponowany układ diagramu

Najczytelniejszy układ diagramu:

```txt
                accounts
                   ^
                   |
sessions      users      verification_tokens
                   |
                   v
          userpreferences

notes        checklists        tasks        projects
  |              ^   ^           ^  \          ^  |
  |              |   |           |   \         |  |
  |              |   +-----------+    \--------+  |
  |              | checklistIds[]       taskIds[] |
  |              |                                |
  +---- linkedItems[] ----------------------------+

pins -----------------------> notes / checklists / tasks / projects
activityevents -------------> notes / checklists / tasks / projects
projects.kanbanColumns.id --> tasks.statusId
```

W praktyce warto narysować `users` jako główną kolekcję u góry, a pod nią cztery główne kolekcje domenowe: `notes`, `checklists`, `tasks` i `projects`. Połączenia właścicielskie z `users` można poprowadzić pionowo w dół. Połączenia między kolekcjami domenowymi powinny znajdować się w środkowej części diagramu, ponieważ to one opisują właściwą strukturę aplikacji.

### 7. Oznaczenia kardynalności

W Lucidchart można dodać oznaczenia kardynalności przy liniach relacji. Dla tej bazy danych należy zastosować następujące oznaczenia:

| Relacja | Kardynalność |
| --- | --- |
| `users -> notes` | 1:N |
| `users -> checklists` | 1:N |
| `users -> tasks` | 1:N |
| `users -> projects` | 1:N |
| `users -> pins` | 1:N |
| `users -> activityevents` | 1:N |
| `users -> userpreferences` | 1:1 |
| `users -> accounts` | 1:N |
| `projects -> tasks` | 1:N |
| `tasks -> checklists` | N:N logiczne, realizowane przez `checklistIds[]` i `parentId` |
| `projects -> checklists` | N:N logiczne, realizowane przez `checklistIds[]` i `parentId` |
| `notes -> notes/checklists/tasks/projects` | N:N polimorficzne |
| `pins -> notes/checklists/tasks/projects` | N:1 polimorficzne |
| `activityevents -> notes/checklists/tasks/projects` | N:1 polimorficzne |

### 8. Elementy, które warto wyróżnić na diagramie

Na gotowej wizualizacji powinny być szczególnie widoczne trzy decyzje projektowe:

1. Wszystkie główne dokumenty aplikacji są przypisane do użytkownika przez `ownerId`.
2. Elementy checklisty i kolumny kanban są osadzone w dokumentach, a nie przechowywane w osobnych kolekcjach.
3. Przypięcia, zdarzenia aktywności i powiązania notatek korzystają z relacji polimorficznych, czyli wskazują różne typy dokumentów za pomocą pary `targetType`/`targetId` albo `entityType`/`entityId`.

### 9. Minimalna wersja diagramu do pracy inżynierskiej

Jeżeli diagram ma być prosty i czytelny w pracy inżynierskiej, wystarczy pokazać następujące elementy:

```txt
users
notes
checklists
tasks
projects
pins
userpreferences
activityevents
```

W wersji uproszczonej można pominąć `sessions`, `accounts` i `verification_tokens`, a kolekcje NextAuth opisać krótką adnotacją obok `users`. Na samym diagramie należy wtedy zostawić tylko relacje aplikacyjne, czyli właścicielstwo przez `ownerId`, powiązania tasków z projektami, checklist z taskami i projektami, kolumn kanban ze statusem taska oraz polimorficzne powiązania `pins`, `activityevents` i `notes.linkedItems`.

## Archiwizacja i usuwanie

Zadania, projekty i checklisty są archiwizowane przez ustawienie `archivedAt`. Projekt przy usunięciu otrzymuje również `lifecycleStatus: "archived"`. Widoki i endpointy listujące pobierają tylko dokumenty z `archivedAt: null`.

Notatki są również modelowane z polem `archivedAt`, ale aktualny endpoint usuwania notatki usuwa dokument fizycznie. To różni notatki od pozostałych encji domenowych i warto brać to pod uwagę przy przyszłym rozwoju aplikacji.

## Uzasadnienie modelu

Model dokumentowy pasuje do aplikacji, ponieważ większość operacji dotyczy danych jednego użytkownika i jednego obszaru roboczego: listy notatek, tablicy projektu, checklisty albo dashboardu. Proste dane podrzędne, takie jak elementy checklisty i kolumny Kanban, są osadzone w dokumentach, bo są odczytywane i modyfikowane razem z obiektem nadrzędnym. Większe encje, takie jak zadania, projekty, checklisty i notatki, są osobnymi kolekcjami, ponieważ mogą być filtrowane, przypinane, linkowane i prezentowane w wielu widokach.
