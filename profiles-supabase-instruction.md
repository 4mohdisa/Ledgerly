# Supabase Integration - Profiles Table

When a user sign up or signs in, we should create a new row in the profiles table, we are using the Clerk authentication so we need to fetch the user data from clerk and store it in supabase profiles table.

# Supabase Documentation for Profiles Table

## Table Structure
| Name | Format | Type |
|------|---------|------|
| id | bigint | number |
| email | text | string |
| name | text | string |
| created_at | timestamp with time zone | string |
| updated_at | timestamp with time zone | string |

## Basic Query Operations

### Insert Operations

#### Insert Single Row
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
```

#### Upsert Operation
```typescript
const { data, error } = await supabase
  .from('profiles')
  .upsert({ some_column: 'someValue' })
  .select()
```

### Update Operations

```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
```

## Implementation Examples

### Server-Side Component
```typescript
// app/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul>
      {todos?.map((todo) => (
        <li>{todo}</li>
      ))}
    </ul>
  )
}
```

### Utility Functions

#### Server Client
```typescript
// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options))
        },
      },
    },
  );
};
```

#### Browser Client
```typescript
// utils/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
```

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```