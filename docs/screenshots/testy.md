# Screenshoty do rozdziału o testach

1. `src/lib/task-validation.test.ts` - pokaż cały blok testu `accepts a complete task payload and trims text fields` wraz z asercjami `expect(result.success).toBe(true)`, `expect(result.data.title).toBe(...)`, `expect(result.data.statusId).toBe(...)` i `expect(result.data.tags).toEqual(...)`. Screenshot powinien pokazywać, że test sprawdza nie tylko przyjęcie poprawnych danych taska, ale też automatyczne przycinanie pól tekstowych.

2. `src/app/api/tasks/route.test.ts` - pokaż test `creates a task, links it to a project and records activity`. Na screenie powinny znaleźć się przygotowane mocki `Project.exists`, `Task.create`, `Project.updateOne`, wywołanie `POST(...)` oraz asercje sprawdzające `Task.create`, `$addToSet` w projekcie i `recordActivityEvent` z akcją `created`.

3. `src/app/api/tasks/[taskId]/route.test.ts` - pokaż test `updates an owned task and moves project links` albo, jeśli screen będzie zbyt długi, jego najważniejszą środkową część. Screenshot powinien obejmować wywołanie `PATCH(...)`, asercję `Task.findOneAndUpdate`, usunięcie identyfikatora ze starego projektu przez `$pull`, dopisanie do nowego projektu przez `$addToSet` oraz zapis zdarzenia `recordActivityEvent` z akcją `moved`.
