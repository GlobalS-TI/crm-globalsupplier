Scaffold a typed React component: $ARGUMENTS

Rules (from components/CLAUDE.md):
- Filename and component name: PascalCase — e.g. OpportunityKanbanCard
- Server Component by default; only add 'use client' if real interactivity required
- No `any` in TypeScript
- No business logic — domain conditions come from services via props
- Props interface defined inline with JSDoc comments on each prop

Template:
```tsx
// 'use client'  ← only if needed

import type { FC } from 'react'

interface $ArgumentsProps {
  // define props here
}

const $Arguments: FC<$ArgumentsProps> = ({ /* props */ }) => {
  return (
    <div>
      {/* implementation */}
    </div>
  )
}

export default $Arguments
```

Place file in the most appropriate subdirectory of components/crm/ based on its purpose.
If $ARGUMENTS is empty, ask for the component name.
