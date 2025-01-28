# Clerk User Data Access Guide

## Methods to Read Authenticated User Data

### Frontend API: `useUser()`

```typescript
function getUser(userId: string): Promise<User>
```

The Frontend API allows authenticated users to access their data from browser/native environments.

```typescript
'use client'
import { useUser } from '@clerk/nextjs'

export default function Example() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded || !isSignedIn) {
    return null
  }

  return <div>Hello, {user.firstName} welcome to Clerk</div>
}
```
### Examples

### Fetching User Data from Clerk

```typescript
const userId = 'user_123';
const response = await clerkClient.users.getUser(userId);
console.log(response);
```

#### Example Response:
```typescript
_User {
  // Basic User Information
  id: 'user_123',
  firstName: 'Test',
  lastName: 'User',
  username: null,
  imageUrl: 'https://img.clerk.com/eyJ...',
  hasImage: false,

  // Authentication Status
  passwordEnabled: true,
  totpEnabled: false,
  backupCodeEnabled: false,
  twoFactorEnabled: false,
  banned: false,
  locked: false,

  // Timestamps
  createdAt: 1708103362688,
  updatedAt: 1708103362701,
  lastSignInAt: null,
  lastActiveAt: null,
  legalAcceptedAt: null,

  // Primary Identifiers
  primaryEmailAddressId: 'idn_123',
  primaryPhoneNumberId: null,
  primaryWeb3WalletId: null,

  // Contact Information
  emailAddresses: [
    {
      id: 'idn_123',
      emailAddress: 'testclerk123@gmail.com',
      verification: [_Verification],
      linkedTo: []
    }
  ],
  phoneNumbers: [],
  web3Wallets: [],

  // Additional Data
  externalId: null,
  externalAccounts: [],
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
  createOrganizationEnabled: true
}
```

#### When to Use
- In client components needing user info for UI updates
- For dynamic UI updates based on client events
- When needing real-time user data updates via `reload()`

#### When to Avoid
- In server environments
- For accessing private metadata
- For backend data verification

### Backend API: `currentUser()`
Used for querying user data from server environments.

```typescript
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function Page() {
  const user = await currentUser()
  // Use `user` for rendering or UI elements
}
```

> ⚠️ Rate limited to 100 requests per 10 seconds

#### When to Use
- In server components/actions
- For accessing private metadata
- When handling large user attributes
- For infrequent user data access

#### When to Avoid
- Exceeding rate limits
- Storing user data in database (use user ID instead)

### Session Claims

#### Reading User ID

**Client-side:**
```typescript
'use client'
import { useAuth } from '@clerk/nextjs'

export default function Page() {
  const { isLoaded, userId, sessionId } = useAuth()

  if (!isLoaded || !userId) {
    return null
  }

  return (
    <div>
      Hello, {userId} your current active session is {sessionId}
    </div>
  )
}
```

**Server-side:**
```typescript
import { auth } from '@clerk/nextjs/server'

export default async function Page() {
  const { userId, sessionClaims } = auth()

  if (userId && sessionClaims) {
    const { firstName, lastName, email, avatarUrl, publicMetadata } = sessionClaims
  }
}
```

#### Custom Session Claims
Configure in Clerk dashboard using JSON structure:

```json
{
  "firstName": "{{user.first_name}}",
  "lastName": "{{user.last_name}}",
  "email": "{{user.primary_email_address}}",
  "avatarUrl": "{{user.image_url}}",
  "publicMetadata": "{{user.public_metadata}}"
}
```

#### When to Use Session Claims
- For frequent backend access to user attributes
- Most efficient way to access user ID
- When API rate limits are a concern

#### When to Avoid
- Token size exceeding 4KB
- Accessing private metadata
- Frontend usage (use `useUser()` instead)

## Important Notes

1. **Rate Limits:**
   - Frontend `/v1/me`: Unlimited
   - Backend API: 100 requests/10 seconds

2. **Token Size:**
   - Maximum 4KB for session token
   - Be cautious with large custom claims

3. **Best Practices:**
   - Store only user IDs in your database
   - Fetch latest data from Clerk as needed
   - Use appropriate method based on environment (client/server)

4. **TypeScript Support:**
   - Define global types for custom session claims
   - Enables auto-complete and type checking

# Ledgerly Application Structure

```ascii
Ledgerly/
├── README.md                     # Project documentation
├── package.json                  # Project dependencies and scripts
├── next.config.js               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── middleware.ts                # Main application middleware (auth & data sync)
│
├── app/                         # Next.js App Router Directory
│   ├── layout.tsx              # Root layout with ClerkProvider
│   ├── page.tsx                # Homepage/Dashboard
│   ├── metadata.ts             # App metadata configuration
│   ├── globals.css             # Global styles
│   ├── favicon.ico             # App favicon
│   ├── fonts/                  # Custom fonts
│   │   ├── GeistMonoVF.woff    # Monospace font
│   │   └── GeistVF.woff        # Regular font
│   ├── transactions/           # Transaction management
│   │   └── page.tsx            # Transactions list view
│   └── recurring-transactions/ # Recurring transactions
│       └── page.tsx            # Recurring transactions view
│
├── components/                  # Reusable Components
│   ├── app/                    # Application-specific components
│   │   ├── app-sidebar.tsx     # Main navigation sidebar
│   │   ├── balance-dialog.tsx  # Balance management
│   │   ├── bulk-category-change.tsx  # Bulk operations
│   │   ├── charts/            # Data visualization
│   │   │   ├── bar-chart-interactive.tsx
│   │   │   ├── bar-chart-multiple.tsx
│   │   │   ├── line-chart.tsx
│   │   │   └── pie-donut-chart.tsx
│   │   ├── tables/            # Data tables
│   │   │   └── transactions-table.tsx
│   │   ├── confirmation-dialog.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── metrics-cards.tsx
│   │   ├── month-picker.tsx
│   │   ├── transaction-dialog.tsx
│   │   └── upload-dialog.tsx
│   │
│   ├── providers/              # Context providers
│   │   └── user-sync-provider.tsx  # Clerk-Supabase sync
│   │
│   └── ui/                     # Shadcn UI Components
│       ├── alert-dialog.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── ... (other UI components)
│
├── lib/                        # Utility functions
│   ├── utils.ts               # General utilities
│   └── validators/            # Input validation
│       └── transaction.ts     # Transaction validation
│
├── supabase/                   # Supabase configuration
│   ├── migrations/            # Database migrations
│   │   ├── 20250121_fix_profiles.sql
│   │   └── fix_profiles_manual.sql
│   └── types/                 # Generated types
│
└── utils/                      # Application utilities
    └── supabase/              # Supabase clients
        ├── client.ts          # Browser client
        ├── server.ts          # Server-side client
        └── middleware.ts      # Middleware client
```

## Key Components and Their Purposes

### Authentication & Database
- Clerk handles user authentication
- Supabase serves as the database
- Middleware syncs user data between services

### Core Features
- Transaction management and tracking
- Recurring transaction handling
- Data visualization with charts
- Bulk operations for categories
- File upload capabilities

### UI/UX
- Modern, responsive design with Tailwind CSS
- Reusable UI components from Shadcn
- Interactive data visualization
- Form handling and validation

### Data Management
- Type-safe database operations
- Server and client-side data handling
- Robust validation schemas