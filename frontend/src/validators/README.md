# Validation Strategy (Zod)

All form/request validation schemas live in this directory.

## Rules
- Keep schemas grouped by domain file.
- Export schemas from `index.js` only.
- Use schema names that match use-case intent (for example, `inviteMemberSchema`).
- Reuse shared primitives from `schema-utils.js`.

## React Hook Form Usage

Use schemas with `zodResolver`:

```js
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteMemberSchema } from '@/validators/index.js'

const methods = useForm({
  resolver: zodResolver(inviteMemberSchema),
  defaultValues: { email: '', role: 'VIEWER' },
})
```
