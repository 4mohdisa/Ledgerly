# Ledgerly Implementation Instructions

> Use this document as a comprehensive guide for implementing the Ledgerly expense management platform. Each section includes specific Shadcn component requirements and references to the provided code examples.

## Project Overview
Ledgerly is a comprehensive personal expense management platform that helps users track and analyze their financial transactions through:
- Automated bank statement processing (CSV, XML, PDF)
- AI-powered transaction categorization
- Interactive financial dashboards
- Recurring transaction management
- Custom category management
- Multi-account support (Cash, Savings, Checking)

## Tech Stack

### Frontend
- Next.js (React Framework)
- React (UI Library)
- Tailwind CSS (Styling)
- Shadcn UI Components (Pre-built components)
- Clerk Auth (Authentication)
- Redux Toolkit (State management)
- Recharts (Data visualization)

### Backend
- Supabase (PostgreSQL database)
- LlamaParser (Document processing)
- OpenAI GPT-4 (Transaction categorization)
- Supabase Storage (File storage)

# Detailed Implementation Order

## Phase 1: Core UI & Navigation Setup

### Step 1: Project Structure & Layout (Week 1, Days 1-2)
- `/app/layout.tsx` - Root layout with ClerkProvider and SidebarProvider
- `/app/page.tsx` - Dashboard page
- `/app/categories/page.tsx` - Categories management page
- `/app/transactions/page.tsx` - Transactions page
- `/app/recurring-transactions/page.tsx` - Recurring transactions page

Base routes:
```
/                     -> Dashboard
/categories           -> Categories Management
/transactions         -> Transactions List
/recurring-transactions -> Recurring Transactions
```

### Step 2: Core Components (Week 1, Days 2-3)
# Core Components To Create

## Layout Components
1. `/components/app/app-sidebar.tsx`
   - Uses shadcn Sidebar
   - Fixed navigation items:
     - Dashboard
     - Transactions
     - Categories
     - Recurring Transactions
   - User profile section with Clerk UserButton

## Data Display Components
2. `/components/app/transactions-table.tsx`
   - Wraps shadcn DataTable
   - Fixed columns configuration
   - Transaction-specific actions
   - Export functionality

3. `/components/app/categories-table.tsx`
   - Wraps shadcn DataTable
   - Category-specific columns
   - Icon and color display
   - Usage count

4. `/components/app/recurring-table.tsx`
   - Wraps shadcn DataTable
   - Recurring-specific columns
   - Frequency display
   - Next occurrence

## Chart Wrappers
5. `/components/app/spending-chart.tsx`
   - Wraps Recharts BarChart
   - Monthly spending visualization
   - Income vs Expenses

6. `/components/app/category-distribution.tsx`
   - Wraps Recharts PieChart
   - Category spending breakdown
   - Fixed calculation logic

## Forms
7. `/components/app/transaction-form.tsx`
   - Wraps shadcn Dialog, Form, Select
   - All transaction fields
   - Form validation
   - Submit logic

8. `/components/app/upload-form.tsx`
   - Wraps shadcn Dialog, Form
   - File upload handling
   - Progress display

## Container Components
9. `/components/app/metrics-cards.tsx`
   - Grid of shadcn Cards
   - Fixed metrics:
     - Total Income
     - Total Expenses
     - Net Balance
     - Top Category

10. `/components/app/filters-bar.tsx`
    - Groups shadcn DateRangePicker, Select
    - Common filter options
    - Clear functionality

### Step 3: Dashboard Implementation (Week 1, Days 4-5)
1. Summary Cards:
   - Total Income
   - Total Expenses
   - Net Balance
   - Most Active Category

2. Charts:
   - Monthly Spending (Bar Chart)
   - Category Distribution (Pie Chart)
   - Balance Trends (Line Chart)

3. Recent Transactions Table:
   - Sortable columns
   - Basic filtering
   - Pagination

4. Sidebar Navigation:
   - Dashboard
   - Transactions
   - Categories
   - Recurring Transactions

### Step 4: Integration & Testing (Week 1, Day 5)
1. Route Testing:
   - Navigation between pages
   - Sidebar state management
   - Responsive layout testing

2. Component Integration:
   - Chart data flow
   - Table functionality
   - Form submissions

## Next Phases Preview:

### Phase 2: Core Features (Week 2)
- Authentication implementation
- File upload system
- Transaction management
- Category system

### Phase 3: Advanced Features (Week 3)
- Analytics & reports
- Recurring transactions
- Export functionality
- Advanced filtering

### Phase 4: Polish & Optimization (Week 4)
- Performance optimization
- Error handling
- Loading states
- Final testing

## Database Schema

### Supabase Storage Buckets
- files: Stores uploaded bank statements and documents

### Tables

\`\`\`sql
-- Profiles Table
CREATE TABLE profiles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES profiles (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT REFERENCES profiles (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    file_id BIGINT REFERENCES files (id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('Expense', 'Income')),
    account_type TEXT CHECK (account_type IN ('Cash', 'Savings', 'Checking')),
    category_id BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    recurring_frequency TEXT CHECK (
        recurring_frequency IN (
            'Never', 'Daily', 'Weekly', 'Bi-Weekly', 'Tri-Weekly', 'Monthly', 
            'Bi-Monthly', 'Quarterly', 'Semi-Annually', 'Annually',
            'Working Days Only', 'First Day of Week', 'Last Day of Week'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Transactions Table
CREATE TABLE recurring_transactions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT REFERENCES profiles (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('Expense', 'Income')) NOT NULL,
    account_type TEXT CHECK (account_type IN ('Cash', 'Savings', 'Checking')) NOT NULL,
    category_id BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    frequency TEXT CHECK (
        frequency IN (
            'Never', 'Daily', 'Weekly', 'Bi-Weekly', 'Tri-Weekly', 'Monthly', 
            'Bi-Monthly', 'Quarterly', 'Semi-Annually', 'Annually',
            'Working Days Only', 'First Day of Week', 'Last Day of Week'
        )
    ) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files Table
CREATE TABLE files (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT REFERENCES profiles (id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Table
CREATE TABLE analytics (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT REFERENCES profiles (id) ON DELETE CASCADE,
    file_id BIGINT REFERENCES files (id) ON DELETE CASCADE,
    total_income NUMERIC,
    total_expenses NUMERIC,
    spending_by_category JSONB,
    net_balance NUMERIC,
    unusual_transactions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

## Pages Implementation Guide

### 1. /dashboard Route

#### Required Shadcn Components
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Button
- Dialog
- AlertDialog
- Table
- DropdownMenu
- Select
- DateRangePicker
- Input

#### Features
1. Summary Cards
   - Total Income/Expenses
   - Net Balance
   - Most Active Category
   Code Reference: ## 11 Shadcn dashboard with sidebar

2. Interactive Charts
   - Spending Trends (Bar Chart)
     Code Reference: ## 5 Bar chart - Interactive
   - Category Distribution (Pie Chart)
     Code Reference: ## 6 Shadcn Pie Chart - Donut with Text
   - Balance Trends (Line Chart)
     Code Reference: ## 8 Shadcn Line Chart - Dots Colors

3. Recent Transactions
   - Paginated table
   - Quick filters
   Code Reference: ## 10 Shadcn data table implementation

4. Quick Actions
   - Upload button
   - Add transaction button
   Code Reference: ## 13 Shadcn Popup Form for Adding Manual Transactions

#### Layout
\`\`\`
+------------------+
|    Header        |
+------------------+
| Summary Cards    |
+------------------+
| Main Chart       |
+------------------+
| Secondary Charts |
+------------------+
| Recent Trans.    |
+------------------+
\`\`\`

### 2. /transactions Route

#### Required Shadcn Components
- Table (with sorting, filtering, and pagination)
- Button
- Input
- Select
- AlertDialog
- Dialog
- Form
- DateRangePicker
- DropdownMenu
- Card

#### Features
1. Transaction Table
   - Sorting
   - Filtering
   - Batch actions
   Code Reference: ## 10 Shadcn data table implementation

2. Search & Filters
   - Date range picker
   - Category filter
   - Account filter
   Code Reference: ## 12 Date Range Picker

3. Transaction Actions
   - Add new
   - Edit
   - Delete
   - Export
   Code Reference: ## 13 Shadcn Popup Form for Adding Manual Transactions

#### Layout
\`\`\`
+------------------+
|    Filters       |
+------------------+
|    Actions       |
+------------------+
| Transaction Table|
+------------------+
|    Pagination    |
+------------------+
\`\`\`

### 3. /categories Route

#### Required Shadcn Components
- Table
- Button
- Dialog
- Form
- Input
- ColorPicker
- Select
- AlertDialog
- Card
- Badge

#### Features
1. Categories List
   - Name
   - Icon
   - Usage count
   - Actions
   Code Reference: ## 10 Shadcn data table implementation

2. Category Form
   - Name input
   - Icon selector
   - Color picker
   Code Reference: ## 13 Shadcn Popup Form for Adding Manual Transactions

3. Category Analytics
   - Usage chart
   - Trend analysis
   Code Reference: ## 6 Shadcn Pie Chart - Donut with Text

#### Layout
\`\`\`
+------------------+
|    Actions       |
+------------------+
| Categories Table |
+------------------+
| Usage Analytics  |
+------------------+
\`\`\`

### 4. /recurring-transactions Route

#### Required Shadcn Components
- Table
- Dialog
- Form
- DateRangePicker
- Select
- Input
- AlertDialog
- Card
- Badge
- Calendar

#### Features
1. Recurring Transactions Table
   - Frequency
   - Amount
   - Next date
   Code Reference: ## 10 Shadcn data table implementation

2. Add/Edit Form
   - Transaction details
   - Frequency settings
   - Date range
   Code Reference: ## 13 Shadcn Popup Form for Adding Manual Transactions

3. Calendar View
   - Upcoming transactions
   - Visual schedule
   Code Reference: ## 12 Date Range Picker

#### Layout
\`\`\`
+------------------+
|    Actions       |
+------------------+
| Recurring Trans. |
+------------------+
| Calendar View    |
+------------------+
\`\`\`

## Core Features Implementation

### 1. Authentication (Priority: Highest)
- **Shadcn Components**: ClerkProvider, Button, Card
- **Implementation Dependencies**: @clerk/nextjs
Implementation: Clerk Authentication
Requirements:
- Email/password login
- Google OAuth
- User profile creation
Code Reference: ## 1 Clerk Implementation example

### 2. File Processing (Priority: High)
- **Shadcn Components**: Dialog, AlertDialog, Button, Progress, Form
- **Processing Libraries**: LlamaParser, OpenAI
Requirements:
- File upload to Supabase storage
- Text extraction with LlamaParser
- Transaction parsing
Code References:
- ## 2 Llama Parser documentation
- ## 3 OpenAI Structured data extraction
- ## 4 Supabase Implementation Example

### 3. Transaction Management (Priority: High)
- **Shadcn Components**: Table, Form, Dialog, Select, DateRangePicker, Button, AlertDialog
- **Data Handling**: Supabase, React Hook Form
Features:
- CRUD operations
- Batch actions
- Categorization
- Search & filter
Code References:
- ## 10 Shadcn data table implementation
- ## 13 Shadcn Popup Form for Adding Manual Transactions

### 4. Analytics & Visualization (Priority: Medium)
- **Shadcn Components**: Card, BarChart, PieChart, LineChart, RadarChart
- **Visualization Libraries**: Recharts
Features:
- Interactive charts
- Trend analysis
- Category insights
Code References:
- ## 5 Bar chart - Interactive
- ## 6 Shadcn Pie Chart - Donut with Text
- ## 8 Shadcn Line Chart - Dots Colors

## API Endpoints

### Transactions
\`\`\`typescript
// GET /api/transactions
interface GetTransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
}

// POST /api/transactions
interface CreateTransactionRequest {
  date: string;
  amount: number;
  name: string;
  type: 'Expense' | 'Income';
  category_id?: number;
  description?: string;
}

// Additional endpoints...
\`\`\`

### Categories
\`\`\`typescript
// GET /api/categories
interface GetCategoriesResponse {
  categories: Category[];
}

// POST /api/categories
interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

// Additional endpoints...
\`\`\`

## Error Handling

### Frontend
- Use shadcn Alert Dialog for user notifications
- Implement React Error Boundaries
- Form validation with proper error messages
Code Reference: ## 13 Shadcn Popup Form for Adding Manual Transactions

### Backend
- HTTP status codes for API errors
- Detailed error messages
- Transaction rollback on failures

## Security Implementation

### Authentication
- Clerk authentication
- Protected API routes
- CSRF protection
Code Reference: ## 1 Clerk Implementation example

### Data Access
- Row Level Security in Supabase
- User data isolation
- Input sanitization

### File Upload
- File type validation
- Size limits
- Virus scanning
Code Reference: ## 4 Supabase Implementation Example

## Testing Requirements

### Unit Tests
- Utility functions
- Component rendering
- State management

### Integration Tests
- API endpoints
- Database operations
- File processing

### E2E Tests
- User flows
- Authentication
- Transaction management

### Code Example Documentation

### ## 1. Clerk Implementation example

**Add ClerkProvider to your app**

The ClerkProvidercomponent provides session and user context to Clerk's hooks and components. It's recommended to wrap your entire app at the entry point with ClerkProvider to make authentication globally accessible. See the [reference docs](https://clerk.com/docs/components/clerk-provider) for other configuration options.

You can control which content signed-in and signed-out users can see with Clerk's prebuilt components.

**/src/app/layout.tsx**

```jsx
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import './globals.css'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### ## 2. Llama Parser documentation for implementating with typescript

```jsx
import {
  LlamaParseReader,
  // Optionally include additional utilities
} from "llamaindex";
import 'dotenv/config'; // Ensure environment variables are loaded

async function processUploadedFile(filePath: string) {
  try {
    // Initialize LlamaParser reader
    const reader = new LlamaParseReader({ resultType: "text" });

    // Parse the uploaded document
    const documents = await reader.loadData(filePath);

    // Combine all document chunks into a single text output
    const fullText = documents.map((doc) => doc.text).join("\n");

    // Log the full extracted text
    console.log("Extracted Text:", fullText);

    // Custom logic to parse transactions from text (implement parseTransactions)
    const transactions = parseTransactions(fullText);

    // Save transactions to Supabase PostgreSQL database
    await saveTransactionsToDatabase(transactions);

    return { success: true };
  } catch (error) {
    console.error("Error processing file:", error);

    // Show error message using shadcn Alert Dialog
    showErrorDialog({
      title: "Extraction Failed",
      description: `An error occurred while processing the file: ## {error.message}. Please try again.`,
      actions: [
        { label: "Retry", onClick: () => retryFileUpload(filePath) },
        { label: "Cancel", onClick: () => console.log("Operation canceled.") },
      ],
    });

    throw new Error("Text extraction failed.");
  }
}

// Example function for saving transactions to the database
async function saveTransactionsToDatabase(transactions) {
  // Replace with database integration logic (e.g., Supabase client)
  console.log("Saving transactions:", transactions);
}

// Example implementation of shadcn Alert Dialog
function showErrorDialog({ title, description, actions }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button>Error</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {actions.map((action) => (
            <button onClick={action.onClick} key={action.label}>
              {action.label}
            </button>
          ))}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Example parsing function
function parseTransactions(text: string) {
  // Custom parsing logic to extract transactions
  // Example: Split text by lines and extract specific fields
  const transactions = text.split("\n").map((line) => {
    const [date, amount, name, type] = line.split(",");
    return {
      date,
      amount,
      name,
      type,
      transactionId: generateUniqueId(), // Generate unique transaction ID
    };
  });
  return transactions;
}

// Helper function to generate unique IDs
function generateUniqueId() {
  return `txn-## {Math.random().toString(36).substr(2, 9)}`;
}
```

**Workflow Summary:**

1. **File Upload**:
    - Users upload a file via the UI.
    - The file is processed immediately on the server.
2. **Text Extraction**:
    - LlamaParser extracts and combines the full text from all document chunks.
3. **Transaction Parsing**:
    - Parse extracted text to identify and structure transactions.
4. **Error Handling**:
    - Use **shadcn Alert Dialog** to handle errors during extraction or parsing.
5. **Data Storage**:
    - Save parsed transactions to the database and display them in the user's dashboard.
6. **Data Validation**:
    - Ensure transactions fall within the user-specified date range.

This implementation ensures a seamless user experience while maintaining data security and accuracy.

### **## 3. OpenAI Structured data extraction**

Make sure you use the gpt-4o model and zod for defining data structures.

```jsx
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI();

const ResearchPaperExtraction = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  abstract: z.string(),
  keywords: z.array(z.string()),
});

const completion = await openai.beta.chat.completions.parse({
  model: "gpt-4o-2024-08-06",
  messages: [
    { role: "system", content: "You are an expert at structured data extraction. You will be given unstructured text from a research paper and should convert it into the given structure." },
    { role: "user", content: "..." },
  ],
  response_format: zodResponseFormat(ResearchPaperExtraction, "research_paper_extraction"),
});

const research_paper = completion.choices[0].message.parsed;
```

### ## 4. Supabase Implementation Example

**Query Supabase data from Next.js**

Create a new file at `app/countries/page.tsx` and populate with the following.

This will select all the rows from the `countries` table in Supabase and render them on the page.

app/countries/page.tsx

```jsx
  import { createClient } from '@/utils/supabase/server';

  export default async function Countries() {
    const supabase = await createClient();
    const { data: countries } = await supabase.from("countries").select();

    return <pre>{JSON.stringify(countries, null, 2)}</pre>
  }
```

utils/supabase/server.ts

```jsx
  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'

  export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  }
```

### Adding files to supabase storage example

```sql
import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// Upload file using standard upload
async function uploadFile(file) {
  const { data, error } = await supabase.storage.from('bucket_name').upload('file_path', file)
  if (error) {
    // Handle error
  } else {
    // Handle success
  }
}

```

### ## 5. Bar chart - Interactive

This will serve as our main chart, occupying three grid spaces on /dashboard route, while all other charts will take up one grid space each. Each row will contain a single chart.

```jsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive bar chart"

const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
]

const chartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function Component() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop")

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    []
  )

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Bar Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {["desktop", "mobile"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-## {activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

---

### ## 6. Shadcn Pie Chart - Donut with Text

```jsx
"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 190, fill: "var(--color-other)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function Component() {
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Donut with Text</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Visitors
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
```

### ## 7. Shadcn Bar Chart - Multiple

```jsx
"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function Component() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Multiple</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
```

### ## 8. Shadcn Line Chart - Dots Colors

```jsx
"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Dot, Line, LineChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "hsl(var(--chart-2))",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function Component() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Dots Colors</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 24,
              left: 24,
              right: 24,
            }}
          >
            <CartesianGrid vertical={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  nameKey="visitors"
                  hideLabel
                />
              }
            />
            <Line
              dataKey="visitors"
              type="natural"
              stroke="var(--color-visitors)"
              strokeWidth={2}
              dot={({ payload, ...props }) => {
                return (
                  <Dot
                    key={payload.browser}
                    r={5}
                    cx={props.cx}
                    cy={props.cy}
                    fill={payload.fill}
                    stroke={payload.fill}
                  />
                )
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
```

### ## 9. Radar Chart - Dots

```jsx
"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 273 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function Component() {
  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Radar Chart - Dots</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid />
            <Radar
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          January - June 2024
        </div>
      </CardFooter>
    </Card>
  )
}
```

---

### **## 10. Shadcn data table implementation**

```jsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@yahoo.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@gmail.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@gmail.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@gmail.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@hotmail.com",
  },
]

export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

```

### ## 11. Shadcn dashbaord with sidebar that collapses to icons

```jsx
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

```

```jsx
"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

```

```jsx
"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

```

```jsx
"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

```

```jsx
"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

```

```jsx
"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

```

### ## 12. Date Range Picker

```jsx
"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerWithRange({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  })

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

```

### ## 13. Shadcn Popup Form for Adding Manual Transactions

```jsx
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";

export function AddTransactionForm() {
  const { register, handleSubmit, setValue } = useForm();

  const onSubmit = (data) => {
    console.log("Transaction Data:", data);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Date</label>
            <Input type="date" {...register("date", { required: true })} />
          </div>
          <div>
            <label>Amount</label>
            <Input type="number" placeholder="Enter amount" {...register("amount", { required: true })} />
          </div>
          <div>
            <label>Name</label>
            <Input type="text" placeholder="Transaction name" {...register("name", { required: true })} />
          </div>
          <div>
            <label>Type</label>
            <Select onValueChange={(value) => setValue("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </Select>
          </div>
          <div>
            <label>Account Type</label>
            <Select onValueChange={(value) => setValue("account_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Account Type" />
              </SelectTrigger>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="checking">Checking</SelectItem>
            </Select>
          </div>
          <div>
            <label>Category</label>
            <Select onValueChange={(value) => setValue("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
            </Select>
          </div>
          <div>
            <label>Recurring Options</label>
            <Select onValueChange={(value) => setValue("recurring_frequency", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Recurrence" />
              </SelectTrigger>
              <SelectItem value="never">Never Repeat</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </Select>
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

# Important Implementations Notes

## 0. Adding logs
- Always add server side logs to your code so we can debug any errors.
- Always add console logs to your code so we can debug any errors.

## 1. Project Setup
- All new components should be added to the `/components` directory at the root of the project (not in the app directory) and be named like example-component.tsx unless atherwise specified.
- All new pages should be added to the `/app` directory at the root of the project (not in the pages directory) and be named like example-page.tsx unless otherwise specified.
- Use the Next.js 14 ap router.
- All data fetching should be done with Server Components and pass the data down as props.
- Client components (useState, hooks, etc.) require that 'use client' be added to the top of the file.

## 2. Server-side API calls
- All interactions with external APIs should be done with Server Components.
- Create dedicated API routes in the `/api` directory  for each API call.
- Client-side components should fetch data through these API routes, not directly from external APIs.

## 3. Environment Variables
- Store all sensitive data in environment variables.
- Use the `.env.local` ensure listed in the `.gitignore`.
- For production, set environment variables in the deployment platform.
- Access environment variables only in server-side code or API routes.

## 4. Error Handling and Logging
- Implement comprehensive error handling and logging for both client-side and server-side API routes.
- Log errors on the server-side for debugging.
- Use the `console.error` method to log errors on the client-side for debugging.
- Display error messages to the user in a user-friendly way.

## 5. Type Safety
- Use typescript interface for all data structures, especially for API responses.
- Avoid using `any` type; instead, define proper types for all data structures.

## 6. API client initialization
- Initialize the API client in server-side code only.
- Implement checks to ensure API client are propertly initialized before use.

## 7. Data fetching in components
- Use React hooks (e.ge, useState, useEffect, etc.) to fetch data in client-side components.
- Use the `env` property in `next.config.js` to access environment variables.

## 8. Next.js configuration
- Utilize the `next.config.js` for environment variable configuration.
- Use the `env` property in `next.config.js` to access environment variables.

## 9. CORES and API Routes
- Use Next.js API routes to avoid CORS issues when interacting with external APIs.
- Implement proper request validation in API routes.

## 10. Component structure
- Seperate concerns between client and server components.
- Use server components for initial data fetching and pass data as props to client components.

## 11. Security
- Never expose sensitive data, such as API keys, in client-side code.
- Use secure HTTP methods (e.g., POST instead of GET) to avoid data exposure.