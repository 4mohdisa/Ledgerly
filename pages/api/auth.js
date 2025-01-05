import { withClerkMiddleware } from '@clerk/nextjs/server';

export default withClerkMiddleware((req, res) => {
  if (req.method === 'POST') {
    // Handle user authentication logic here
    res.status(200).json({ message: 'Authentication successful' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});
