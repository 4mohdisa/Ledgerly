## Transactions feature overview

Transactions is a core feature of Ledgerly, allowing users to add, delete, and update their financial transactions, categorize them, and track their spending patterns, an authenticated user can perform the following actions:
- Add transactions
- Delete transactions
- Update transactions
- View transactions
Authenticated users can only see/edit/delete their own transactions. Our Authentication is based on clerk.

## SQL Definition of profiles

```sql
create table public.profiles (
  id text not null,
  email text not null,
  name text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists profiles_user_id_idx on public.profiles using btree (id) TABLESPACE pg_default;

create index IF not exists profiles_email_idx on public.profiles using btree (email) TABLESPACE pg_default;
```

## Profile data types

```sql
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
```

## Current profiles table policies

- ALL Allow all authenticated operations on profiles: Applied to:public role

## Transactions Table SQL Definition

```sql
create table public.transactions (
  id bigint generated always as identity not null,
  user_id text null,
  date date not null,
  file_id bigint null,
  amount numeric not null,
  name text not null,
  description text null,
  type text null,
  account_type text null,
  category_id bigint null,
  category_name text null,
  recurring_frequency text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_category_id_fkey foreign KEY (category_id) references categories (id) on delete set null,
  constraint transactions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint transactions_account_type_check check (
    (
      account_type = any (
        array['Cash'::text, 'Savings'::text, 'Checking'::text]
      )
    )
  ),
  constraint transactions_recurring_frequency_check check (
    (
      recurring_frequency = any (
        array[
          'Never'::text,
          'Daily'::text,
          'Weekly'::text,
          'Bi-Weekly'::text,
          'Tri-Weekly'::text,
          'Monthly'::text,
          'Bi-Monthly'::text,
          'Quarterly'::text,
          'Semi-Annually'::text,
          'Annually'::text,
          'Working Days Only'::text,
          'First Day of Week'::text,
          'Last Day of Week'::text
        ]
      )
    )
  ),
  constraint transactions_type_check check (
    (
      type = any (array['Expense'::text, 'Income'::text])
    )
  )
) TABLESPACE pg_default;
```
## Transactions data types

```sql
      transactions: {
        Row: {
          account_type: string | null
          amount: number
          category_id: number | null
          category_name: string | null
          created_at: string | null
          date: string
          description: string | null
          file_id: number | null
          id: number
          name: string
          recurring_frequency: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          amount: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          file_id?: number | null
          id?: never
          name: string
          recurring_frequency?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          amount?: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          file_id?: number | null
          id?: never
          name?: string
          recurring_frequency?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

## Current transaction table policies

- DELETE transactions_delete: Applied to:authenticated role
- INSERT transactions_insert: Applied to:authenticated role
- SELECT transactions_select: Applied to:authenticated role
- UPDATE transactions_update: Applied to:authenticated role

## Current JWT template claims in clerk

```json
{
	"aud": "authenticated",
	"role": "authenticated",
	"email": "{{user.primary_email_address}}",
	"user_id": "{{user.id}}",
	"app_metadata": {
		"provider": "clerk"
	},
	"user_metadata": {
		"full_name": "{{user.full_name}}"
	}
}
```
we cannot add sub to JWT template claims because of this error "You can't use the reserved claim: sub"

## Documentations from Supabase to insert rows in the table

insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('transactions')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('transactions')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('transactions')
  .upsert({ some_column: 'someValue' })
  .select()

  ## Current file structure

.
├── README.md
├── app
│   ├── auth-error
│   ├── favicon.ico
│   ├── fonts
│   ├── globals.css
│   ├── layout.tsx
│   ├── metadata.ts
│   ├── page.tsx
│   ├── recurring-transactions
│   └── transactions
├── clerk-get-token.md
├── components
│   ├── app
│   ├── auth
│   ├── providers
│   └── ui
├── components.json
├── data
│   ├── account-types.ts
│   ├── categories.ts
│   ├── frequencies.ts
│   ├── recurring-transactions.ts
│   ├── transactions.ts
│   ├── transactiontypes.ts
│   └── upcoming-transactions.ts
├── database.types.ts
├── hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── ledgerly-instructions.md
├── lib
│   └── utils.ts
├── middleware.ts
├── next-env.d.ts
├── next.config.js
├── next.config.mjs
├── package-lock.json
├── package.json
├── pages
│   └── api
├── postcss.config.js
├── postcss.config.mjs
├── profiles-clerk-instructions.md
├── profiles-supabase-instruction.md
├── public
│   └── Ledgerly.svg
├── supabase
│   ├── config.toml
│   ├── fix_profiles_manual.sql
│   └── migrations
├── tailwind.config.js
├── transactions.md
├── tsconfig.json
└── utils
    └── supabase

middleware.ts

```js
import { clerkClient, clerkMiddleware } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/middleware";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Define protected routes
const protectedRoutes = [
  '/',
  '/transactions',
  '/recurring-transactions'
];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const { supabase, response } = createClient(req);
  const errorUrl = new URL('/auth-error', req.url);

  // Get the pathname from the URL
  const pathname = new URL(req.url).pathname;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.includes(pathname);

  if (isProtectedRoute) {
    // Handle non-authenticated users for protected routes
    if (!userId) {
      return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
    }

    // Handle authenticated users
    try {
      const token = await (await auth()).getToken({ template: 'supabase' });
      if (!token) {
        console.error('No auth token available');
        errorUrl.searchParams.set('code', 'no_token');
        return NextResponse.redirect(errorUrl);
      }

      // Set Supabase session
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: ""
      });

      // Get Clerk user details
      const clerk = clerkClient();
      const clerkUser = await (await clerk).users.getUser(userId);
      
      if (!clerkUser.emailAddresses[0]?.emailAddress) {
        console.error('No email address found for user');
        errorUrl.searchParams.set('code', 'no_email');
        return NextResponse.redirect(errorUrl);
      }

      // Attempt to upsert profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'Anonymous',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('Profile sync failed:', upsertError);
        // Don't redirect on profile sync failure, just log it
        console.warn('Continuing despite profile sync failure');
      }
    } catch (error: unknown) {
      console.error('Auth process failed:', error);
      // Only redirect on critical auth errors
      if (error instanceof Error && error.message.includes('No auth token')) {
        errorUrl.searchParams.set('code', 'auth_process');
        return NextResponse.redirect(errorUrl);
      }
    }
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|_static|_vercel|[^?]*\\..*).*)',
    '/api/(.*)'
  ]
};
```