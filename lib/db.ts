// This is a placeholder for your database client (e.g., Prisma).
// For actual functionality, you'd configure Prisma and export its client.
// Example with Prisma:

// import { PrismaClient } from '@prisma/client';

// let prisma: PrismaClient;

// if (process.env.NODE_ENV === 'production') {
//   prisma = new PrismaClient();
// } else {
//   if (!global.prisma) {
//     global.prisma = new PrismaClient();
//   }
//   prisma = global.prisma;
// }

// export default prisma;

// For now, a mock DB for demonstration of security features.
// NEVER use this in production.

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user';
}

interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  visibility: 'private' | 'public' | 'unlisted';
}

const mockUsers: User[] = [];
const mockProjects: Project[] = [];

export const db = {
  users: {
    findByEmail: async (email: string) => mockUsers.find(u => u.email === email),
    findById: async (id: string) => mockUsers.find(u => u.id === id),
    create: async (user: Omit<User, 'id' | 'role'> & { id?: string; role?: 'admin' | 'user' }) => {
      const newUser = { id: user.id || `user_${mockUsers.length + 1}`, role: user.role || 'user', ...user };
      mockUsers.push(newUser);
      return newUser;
    },
  },
  projects: {
    list: async (userId: string, query: { page: number, limit: number }) => {
      const userProjects = mockProjects.filter(p => p.us