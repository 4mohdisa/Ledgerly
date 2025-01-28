// app/auth-error/page.tsx
export default function AuthErrorPage({
    searchParams,
  }: {
    searchParams: { code?: string }
  }) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p>Error code: {searchParams.code || 'unknown'}</p>
        <a href="/" className="text-blue-500 hover:underline">
          Return to Home
        </a>
      </div>
    );
  }