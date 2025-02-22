import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    imageUrl?: string;
  }

  interface Session {
    token?: string;
    user: DefaultSession['user'];
  }
}