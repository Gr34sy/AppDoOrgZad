# Screenshoty do rozbudowanych rozdziałów

1. Frontend, podrozdział "Implementacja formularza taska" - `src/components/tasks/task-form.tsx` - pokaż fragment komponentu `TaskForm` obejmujący stan formularza, wyliczanie `selectedProject`, `projectStatusOptions` oraz `useEffect` ustawiający poprawny status po wyborze projektu. Screenshot powinien pokazywać, że formularz taska reaguje na wybór projektu i dopasowuje listę statusów do kolumn kanban.

2. Frontend, podrozdział "Implementacja formularza projektu" - `src/components/projects/project-form.tsx` - pokaż fragment z funkcjami `slugifyColumnId`, `normalizeKanbanColumns`, `updateKanbanColumn` oraz `moveKanbanColumn`, albo najważniejszą część tego zakresu, jeśli cały blok będzie zbyt długi. Screenshot powinien pokazywać, w jaki sposób formularz projektu przygotowuje i porządkuje konfigurację kolumn kanban przed zapisem.

3. Backend, podrozdział "Wspólne mechanizmy obsługi żądań API" - `src/lib/api-request.ts` - pokaż cały moduł z funkcjami `readJsonBody` oraz `parseJsonBody`. Screenshot powinien pokazywać, że backend najpierw bezpiecznie odczytuje ciało żądania JSON, a następnie waliduje je przekazanym schematem Zod i zwraca ujednoliconą parę `data` / `error`.

4. Backend, podrozdział "Wspólne mechanizmy obsługi żądań API" - `src/lib/session.ts` oraz `src/lib/sanitize-mutation.ts` - pokaż obok siebie albo na jednym zrzucie funkcję `getCurrentUserId`, odpowiedzi `unauthorizedResponse` / `notFoundResponse` oraz funkcję `sanitizeMutation`. Screenshot powinien pokazywać wspólny mechanizm pobierania użytkownika z sesji i oczyszczania danych z pól technicznych przed zapisem w bazie.
