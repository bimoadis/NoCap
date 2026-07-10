# Coding Standards

Developers and automated processes contributing to NOCAP must adhere to the following naming, formatting, and structural guidelines.

## 1. TypeScript Coding Rules
* **Strict Configuration**: Ensure `tsconfig` enables strict checking (e.g. `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`).
* **Explicit Typing**: Avoid using the `any` type. Always declare interface profiles or use structural unions for complex responses.
* **Asynchronous Patterns**: Use `async/await` structures for async calls. Avoid nested `.then()` execution trees.

## 2. API Route Declarations (Fastify)
* **Schema Validation**: All routes must enforce request validations using JSON schema definitions:
  ```typescript
  import { FastifySchema } from 'fastify';

  export const scanSchema: FastifySchema = {
    body: {
      type: 'object',
      required: ['mint'],
      properties: {
        mint: { type: 'string', pattern: '^[1-9A-HJ-NP-Za-km-z]{32,44}$' },
        stream: { type: 'boolean', default: false }
      }
    }
  };
  ```
* **Plugin Scopes**: Use Fastify plugins (`fastify-plugin`) to bundle route modules and encapsulate shared database client access.

## 3. Naming Conventions
* **Directories & Files**: Use kebab-case for naming files and directories (e.g. `wallet-profiles.ts`).
* **Variables & Functions**: Use camelCase for variables and function names.
* **Classes & Interfaces**: Use PascalCase for naming classes and interfaces.
* **Database Columns**: Use snake_case for table names and column headers.
