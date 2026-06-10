List all ADRs in docs/adr/ and show their status.

Steps:
1. Run: find docs/adr -name "*.md" | sort
2. For each file, extract the first 4 lines to get title and Status
3. Output a formatted table:
   | File | Title | Status | Sprint |
4. If $ARGUMENTS matches an ADR number or keyword, show the full content of that ADR

If the docs/adr/ directory is empty or does not exist, say so.
