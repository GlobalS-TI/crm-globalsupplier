Create a new Supabase migration file in supabase/migrations/.

Steps:
1. Read docs/sprint-current.md to get the current sprint number
2. Use today's date in YYYYMMDD format
3. Filename: supabase/migrations/YYYYMMDD_$ARGUMENTS.sql
4. File must start with this header:
   -- Migration: $ARGUMENTS
   -- Sprint: N
5. If $ARGUMENTS is empty, ask for a short description (snake_case)
6. Ask for the migration SQL content if not provided

Conventions from supabase/CLAUDE.md:
- Never modify an already-applied migration — always create a new one
- Mark workarounds with: -- DEUDA: description
