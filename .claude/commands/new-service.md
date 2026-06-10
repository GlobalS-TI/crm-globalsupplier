Scaffold three files for a new domain entity: $ARGUMENTS

Files to create:
1. lib/repositories/interfaces/I$ArgumentsRepository.ts
   - TypeScript interface with CRUD + domain-specific methods
   - All methods return Promise<T>

2. lib/repositories/supabase/$ArgumentsRepository.ts
   - Implements the interface above
   - Only file allowed to import from lib/supabase/
   - Use createClient() from lib/supabase/server

3. lib/services/$ArgumentsService.ts
   - Imports the interface (not the implementation)
   - Receives repository via constructor injection
   - Enforces business rules from lib/CLAUDE.md

4. lib/validations/$arguments.ts
   - Zod schema: createSchema, updateSchema, and inferred types
   - Import this on both client forms and server actions

Naming rules (from lib/CLAUDE.md):
- Functions: verb + noun — getStaleOpportunities(), markActivityComplete()
- Never: getData(), handle(), process()
- No `any` in TypeScript

If $ARGUMENTS is empty, ask for the entity name.
