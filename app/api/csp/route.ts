import { NextResponse } from 'next/server';

/**
 * API route to set Content Security Policy headers
 * This ensures the headers are applied consistently across the application
 */
export async function GET() {
  // Create a new response
  const response = new NextResponse(
    JSON.stringify({ success: true, message: 'CSP headers set' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  // Set the Content Security Policy header
  // Include 'unsafe-eval' to allow libraries like xlsx, mathjs, and llamaindex to function
  // Include wss://*.supabase.co to allow WebSocket connections for Supabase realtime features
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://gaphbnspyqosmklayzvj.supabase.co;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://*.supabase.co;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com;
    frame-src 'self';
    object-src 'none';
  `.replace(/\s+/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
