# Projekt bazy danych

Projekt zakłada MongoDB jako główną bazę dokumentową oraz NextAuth jako źródło kolekcji autoryzacyjnych.

## Kolekcje NextAuth

Adapter `@next-auth/mongodb-adapter` tworzy i obsługuje:

- `users` - użytkownicy OAuth
- `accounts` - powiązane konta Google, GitHub, Facebook
- `sessions` - sesje, gdy zostanie użyta strategia bazodanowa
- `verification_tokens` - tokeny weryfikacyjne

W aplikacji używana jest strategia `jwt`, ale kolekcje `users` i `accounts` nadal są potrzebne do trwałego powiązania kont OAuth.

## Kolekcja `userpreferences`

Preferencje użytkownika.

| Pole | Typ | Opis |
| --- | --- | --- |
| `userId` | `ObjectId` | Referencja do `users._id`, unikalna |
| `theme` | `string` | `system`, `light`, `dark`, `forest`, `sky`, `rose` |
| `dashboardLayout` | `string` | `compact` albo `comfortable` |
| `createdAt` | `Date` | Data utworzenia |
| `updatedAt` | `Date` | Data aktualizacji |

Indeksy:

- `{ userId: 1 }`, unikalny

## Kolekcja `notes`

Notatki w stylu kartek z notatnika.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel notatki |
| `title` | `string` | Tytuł |
| `content` | `string` | Treść notatki |
| `color` | `string` | Kolor kartki |
| `tags` | `string[]` | Tagi |
| `position` | `number` | Kolejność na liście |
| `archivedAt` | `Date \| null` | Archiwizacja |
| `createdAt` | `Date` | Data utworzenia |
| `updatedAt` | `Date` | Data aktualizacji |

Indeksy:

- `{ ownerId: 1, position: 1 }`
- `tags`

## Kolekcja `checklists`

Checklisty mogą istnieć samodzielnie albo należeć do taska/projektu.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel checklisty |
| `title` | `string` | Tytuł |
| `description` | `string` | Opis |
| `items` | `ChecklistItem[]` | Elementy checklisty |
| `tags` | `string[]` | Tagi |
| `parentType` | `string \| null` | `task`, `project` albo `null` |
| `parentId` | `ObjectId \| null` | Identyfikator rodzica |
| `position` | `number` | Kolejność |
| `archivedAt` | `Date \| null` | Archiwizacja |
| `createdAt` | `Date` | Data utworzenia |
| `updatedAt` | `Date` | Data aktualizacji |

`ChecklistItem`:

| Pole | Typ | Opis |
| --- | --- | --- |
| `title` | `string` | Nazwa punktu |
| `isCompleted` | `boolean` | Czy ukończony |
| `completedAt` | `Date \| null` | Data ukończenia |
| `position` | `number` | Kolejność |

Indeksy:

- `{ ownerId: 1, parentType: 1, parentId: 1, position: 1 }`
- `tags`

## Kolekcja `tasks`

Taski z opisem, priorytetem, datą, tagami, przewidywanym czasem realizacji, statusem Kanbana i checklistami.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel taska |
| `projectId` | `ObjectId \| null` | Projekt nadrzędny |
| `title` | `string` | Tytuł |
| `description` | `string` | Opis |
| `priority` | `string` | `low`, `medium`, `high`, `urgent` |
| `statusId` | `string` | Identyfikator kolumny Kanbana, np. `todo`, `testing`, `done` |
| `dueDate` | `Date \| null` | Termin |
| `estimatedMinutes` | `number \| null` | Przewidywany czas realizacji w minutach |
| `tags` | `string[]` | Tagi |
| `checklistIds` | `ObjectId[]` | Checklisty zagnieżdżone w tasku |
| `position` | `number` | Kolejność w statusie albo projekcie |
| `completedAt` | `Date \| null` | Data ukończenia |
| `archivedAt` | `Date \| null` | Archiwizacja |
| `createdAt` | `Date` | Data utworzenia |
| `updatedAt` | `Date` | Data aktualizacji |

Indeksy:

- `{ ownerId: 1, projectId: 1, statusId: 1, position: 1 }`
- `{ ownerId: 1, dueDate: 1, priority: 1 }`
- `tags`

## Kolekcja `projects`

Projekty mają pola podobne do tasków, listę tasków i konfigurację kanbana.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel projektu |
| `title` | `string` | Tytuł |
| `description` | `string` | Opis |
| `priority` | `string` | `low`, `medium`, `high`, `urgent` |
| `lifecycleStatus` | `string` | `active`, `paused`, `completed`, `archived` |
| `dueDate` | `Date \| null` | Termin |
| `estimatedMinutes` | `number \| null` | Przewidywany czas realizacji projektu w minutach |
| `tags` | `string[]` | Tagi |
| `checklistIds` | `ObjectId[]` | Checklisty projektu |
| `taskIds` | `ObjectId[]` | Taski w projekcie |
| `kanbanColumns` | `KanbanColumn[]` | Kolumny kanbana |
| `position` | `number` | Kolejność |
| `completedAt` | `Date \| null` | Data ukończenia |
| `archivedAt` | `Date \| null` | Archiwizacja |
| `createdAt` | `Date` | Data utworzenia |
| `updatedAt` | `Date` | Data aktualizacji |

`KanbanColumn`:

| Pole | Typ | Opis |
| --- | --- | --- |
| `id` | `string` | Stabilny identyfikator statusu używany w `tasks.statusId` |
| `title` | `string` | Nazwa kolumny |
| `position` | `number` | Kolejność kolumny |
| `color` | `string` | Kolor statusu w interfejsie |
| `isDone` | `boolean` | Czy status oznacza zakończenie zadania |

Indeksy:

- `{ ownerId: 1, lifecycleStatus: 1, position: 1 }`
- `{ ownerId: 1, dueDate: 1, priority: 1 }`
- `tags`

## Kolekcja `pins`

Przypięte elementy dashboardu.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel przypięcia |
| `targetType` | `string` | `note`, `checklist`, `task`, `project` |
| `targetId` | `ObjectId` | Identyfikator przypiętego elementu |
| `position` | `number` | Kolejność na dashboardzie |
| `createdAt` | `Date` | Data utworzenia |
| `updatedAt` | `Date` | Data aktualizacji |

Indeksy:

- `{ ownerId: 1, targetType: 1, targetId: 1 }`, unikalny
- `{ ownerId: 1, position: 1 }`

## Kolekcja `activityevents`

Log zdarzeń używany do synchronizacji danych, odświeżania dashboardu i przyszłej obsługi realtime przez SSE/WebSocket albo MongoDB Change Streams.

| Pole | Typ | Opis |
| --- | --- | --- |
| `ownerId` | `ObjectId` | Właściciel zdarzenia |
| `entityType` | `string` | `note`, `checklist`, `task`, `project` |
| `entityId` | `ObjectId` | Dokument, którego dotyczy zdarzenie |
| `action` | `string` | `created`, `updated`, `deleted`, `moved`, `pinned`, `unpinned` |
| `metadata` | `object` | Dodatkowy kontekst zdarzenia |
| `occurredAt` | `Date` | Moment wystąpienia zdarzenia |
| `createdAt` | `Date` | Data utworzenia wpisu |
| `updatedAt` | `Date` | Data aktualizacji wpisu |

Indeksy:

- `{ ownerId: 1, occurredAt: -1 }`
- `{ ownerId: 1, entityType: 1, entityId: 1, occurredAt: -1 }`

## Relacje

- Użytkownik ma wiele notatek, checklist, tasków, projektów i przypięć.
- Task może należeć do projektu przez `projectId`.
- Projekt może przechowywać listę `taskIds`, ale źródłem prawdy dla filtrowania tasków projektu jest `tasks.projectId`.
- Kolumny Kanbana są definiowane per projekt w `projects.kanbanColumns`, a task wskazuje aktywną kolumnę przez `tasks.statusId`.
- Checklisty mogą być samodzielne albo powiązane przez `parentType` i `parentId`.
- Dashboard pobiera `pins`, a następnie doczytuje dokumenty według `targetType`.
- CRUD dla głównych encji jest zabezpieczony przez `ownerId`; endpointy zwracają tylko dokumenty zalogowanego użytkownika.

## Statusy i priorytety

Statusy zadań w Kanbanie nie są sztywnym enumem. Użytkownik może zmienić nazwy, kolejność i kolory kolumn w `projects.kanbanColumns`, np. `in_progress`, `to_change`, `done`, `testing`.

Projekty mają osobny status cyklu życia:

- `active`
- `paused`
- `completed`
- `archived`

Priorytety:

- `low`
- `medium`
- `high`
- `urgent`

## Wydajność i synchronizacja

- Kluczowe listy są indeksowane po `ownerId`, statusie, pozycji, terminie i priorytecie.
- Soft delete przez `archivedAt` pozwala szybko ukrywać elementy bez kosztownych operacji kaskadowych.
- `activityevents` daje podstawę do natychmiastowego odświeżania klienta bez skanowania wszystkich kolekcji.
- Endpoint `GET /api/realtime` udostępnia strumień SSE z nowymi zdarzeniami użytkownika.
