# Struktura bazy danych

Aplikacja używa bazy dokumentowej MongoDB. Dane domenowe są opisane przez modele Mongoose w folderze `src/models`.

Najważniejsza zasada: prawie każdy dokument aplikacji ma pole `ownerId` albo `userId`, które wskazuje właściciela danych. Dzięki temu użytkownik widzi tylko swoje notatki, zadania, checklisty, projekty, ustawienia i przypięte elementy.

## Kolekcje autoryzacji NextAuth

Kolekcje tworzone przez adapter NextAuth:

| Kolekcja | Rola |
| --- | --- |
| `users` | Dane użytkowników logujących się przez OAuth |
| `accounts` | Powiązania użytkownika z kontem Google albo GitHub |
| `sessions` | Sesje przy strategii bazodanowej; w tej aplikacji sesja działa przez JWT |
| `verification_tokens` | Tokeny weryfikacyjne NextAuth |

W aplikacji używana jest strategia sesji JWT, ale kolekcje `users` i `accounts` nadal są potrzebne do trwałego powiązania kont OAuth z użytkownikiem.

## `notes`

Notatki użytkownika.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel notatki |
| `title` | `string` | Tytuł |
| `content` | `string` | Treść |
| `color` | `string` | Kolor kartki |
| `tags` | `string[]` | Tagi |
| `position` | `number` | Kolejność na liście |
| `archivedAt` | `Date \| null` | Pole archiwizacji w modelu |
| `createdAt`, `updatedAt` | `Date` | Daty utworzenia i aktualizacji |

Uwaga: aktualny endpoint usuwania notatek fizycznie usuwa dokument z kolekcji `notes`.

## `tasks`

Zadania użytkownika.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel zadania |
| `projectId` | `ObjectId \| null` | Projekt, do którego należy zadanie; główne powiązanie taska z projektem |
| `title` | `string` | Tytuł |
| `description` | `string` | Opis |
| `priority` | `string` | `low`, `medium`, `high`, `urgent` |
| `statusId` | `string` | Status albo kolumna Kanban |
| `dueDate` | `Date \| null` | Termin |
| `tags` | `string[]` | Tagi |
| `checklistIds` | `ObjectId[]` | Powiązane checklisty |
| `position` | `number` | Kolejność |
| `completedAt` | `Date \| null` | Data ukończenia |
| `archivedAt` | `Date \| null` | Archiwizacja |
| `createdAt`, `updatedAt` | `Date` | Daty utworzenia i aktualizacji |

Zadania mogą być tworzone samodzielnie z widoku tasków albo jako element projektu. W obu przypadkach są zapisywane w tej samej kolekcji `tasks`, dzięki czemu task dodany podczas tworzenia lub edycji projektu jest widoczny także w głównej zakładce zadań użytkownika. Backend sprawdza, czy wskazany `projectId` należy do aktualnego użytkownika.

## `checklists`

Checklisty użytkownika. Mogą działać samodzielnie albo być powiązane z taskiem lub projektem.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel checklisty |
| `title` | `string` | Tytuł |
| `description` | `string` | Opis |
| `items` | `object[]` | Elementy checklisty |
| `tags` | `string[]` | Tagi |
| `parentType` | `string \| null` | `task`, `project` albo `null` |
| `parentId` | `ObjectId \| null` | Identyfikator rodzica |
| `position` | `number` | Kolejność |
| `archivedAt` | `Date \| null` | Archiwizacja |
| `createdAt`, `updatedAt` | `Date` | Daty utworzenia i aktualizacji |

Struktura elementu checklisty:

| Pole | Typ | Opis |
| --- | --- | --- |
| `title` | `string` | Nazwa punktu |
| `isCompleted` | `boolean` | Czy punkt jest ukończony |
| `completedAt` | `Date \| null` | Data ukończenia |
| `position` | `number` | Kolejność punktu |

## `projects`

Projekty użytkownika.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel projektu |
| `title` | `string` | Tytuł |
| `description` | `string` | Opis |
| `priority` | `string` | `low`, `medium`, `high`, `urgent` |
| `lifecycleStatus` | `string` | `active`, `paused`, `completed`, `archived` |
| `dueDate` | `Date \| null` | Termin |
| `tags` | `string[]` | Tagi |
| `checklistIds` | `ObjectId[]` | Checklisty projektu |
| `taskIds` | `ObjectId[]` | Pomocnicza lista zadań projektu |
| `kanbanColumns` | `object[]` | Kolumny Kanban |
| `position` | `number` | Kolejność |
| `completedAt` | `Date \| null` | Data ukończenia |
| `archivedAt` | `Date \| null` | Archiwizacja |
| `createdAt`, `updatedAt` | `Date` | Daty utworzenia i aktualizacji |

Struktura kolumny Kanban:

| Pole | Typ | Opis |
| --- | --- | --- |
| `id` | `string` | Identyfikator statusu |
| `title` | `string` | Nazwa kolumny |
| `position` | `number` | Kolejność kolumny |
| `color` | `string` | Kolor kolumny |
| `isDone` | `boolean` | Czy kolumna oznacza zakończenie |

Relacja projektu z zadaniami jest utrzymywana przede wszystkim przez `tasks.projectId`. Pole `projects.taskIds` pełni rolę pomocniczą dla zgodności i szybkiego odczytu wybranych danych, natomiast listy i liczniki projektów mogą być wyliczane bezpośrednio z kolekcji `tasks`.

## `pins`

Przypięte elementy na dashboardzie.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel przypięcia |
| `targetType` | `string` | `note`, `checklist`, `task`, `project` |
| `targetId` | `ObjectId` | Identyfikator przypiętego elementu |
| `position` | `number` | Kolejność na dashboardzie |
| `createdAt`, `updatedAt` | `Date` | Daty utworzenia i aktualizacji |

Dashboard najpierw pobiera dokumenty z `pins`, a potem na podstawie `targetType` i `targetId` doczytuje właściwe notatki, zadania, checklisty albo projekty.

W interfejsie przypięcie jest obsługiwane wspólnym ikonowym przyciskiem. Stan przypięcia wynika z obecności dokumentu w kolekcji `pins`; przypięty element ma wypełniony przycisk, a nieprzypięty pusty przycisk z ikoną w kolorze akcentu.

## `userpreferences`

Preferencje wyglądu aplikacji zapisane dla użytkownika.

| Pole | Typ | Opis |
| --- | --- | --- |
| `userId` | `ObjectId` | Użytkownik, którego dotyczą preferencje |
| `colorMode` | `string` | `system`, `light`, `dark` |
| `colors` | `object` | Kolory akcentów i kafelków dashboardu |
| `savedThemes` | `object[]` | Zapisane własne motywy |
| `createdAt`, `updatedAt` | `Date` | Daty utworzenia i aktualizacji |

Struktura `colors`:

| Pole | Opis |
| --- | --- |
| `accent` | Główny kolor akcentu |
| `calendar` | Kolor kalendarza |
| `upcoming` | Kolor kafelka upcoming |
| `todo` | Kolor kafelka todo |
| `inProgress` | Kolor kafelka in progress |
| `completed` | Kolor kafelka completed |

## `activityevents`

Zdarzenia aktywności używane do odświeżania widoków i komunikacji realtime.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel zdarzenia |
| `entityType` | `string` | Typ encji, np. `note`, `task`, `project` |
| `entityId` | `ObjectId` | Identyfikator dokumentu |
| `action` | `string` | `created`, `updated`, `deleted`, `pinned`, `unpinned` |
| `metadata` | `object` | Dodatkowe dane zdarzenia |
| `occurredAt` | `Date` | Moment wystąpienia zdarzenia |
| `createdAt`, `updatedAt` | `Date` | Daty utworzenia i aktualizacji |

Endpoint `/api/realtime` wysyła zdarzenia do klienta przez SSE, a klient odświeża widoki po wykryciu zmian.

## Relacje między kolekcjami

Najważniejsze powiązania:

| Relacja | Opis |
| --- | --- |
| `users._id` -> `ownerId` | Użytkownik jest właścicielem notatek, zadań, checklist, projektów, pinów i zdarzeń |
| `users._id` -> `userpreferences.userId` | Użytkownik ma jeden dokument preferencji |
| `projects._id` -> `tasks.projectId` | Zadanie może należeć do projektu; taski projektowe są pełnoprawnymi taskami użytkownika |
| `checklists._id` -> `tasks.checklistIds` | Zadanie może mieć powiązane checklisty |
| `checklists._id` -> `projects.checklistIds` | Projekt może mieć powiązane checklisty |
| `pins.targetId` + `pins.targetType` | Pin wskazuje na notatkę, zadanie, checklistę albo projekt |
| `activityevents.entityId` + `activityevents.entityType` | Zdarzenie wskazuje dokument, którego dotyczy zmiana |

## Prosty schemat logiczny

```txt
users
  |-- accounts
  |-- userpreferences
  |-- notes
  |-- tasks ------ projectId ------> projects
  |      |-- checklistIds --------> checklists
  |
  |-- projects
  |      |-- checklistIds --------> checklists
  |      |-- taskIds -------------> tasks
  |
  |-- checklists
  |-- pins -------- targetId ------> notes / tasks / checklists / projects
  |-- activityevents
```

## Indeksy i wydajność

Modele mają indeksy głównie po:

- `ownerId`, żeby szybko pobierać dane aktualnego użytkownika;
- `position`, żeby sortować elementy na listach i dashboardzie;
- `tags`, żeby filtrować notatki, zadania, checklisty i projekty;
- `dueDate`, `priority`, `statusId`, żeby sortować i filtrować zadania oraz projekty;
- `targetType` i `targetId`, żeby nie tworzyć duplikatów przypięć.

## Ochrona danych

Endpointy API zawsze sprawdzają zalogowanego użytkownika. Operacje na dokumentach są wykonywane z warunkiem `ownerId`, np. aplikacja szuka notatki po jej `_id` oraz po właścicielu. Dzięki temu użytkownik nie może pobrać ani zmodyfikować cudzych danych.
