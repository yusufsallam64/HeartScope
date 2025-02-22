import { ObjectId } from 'mongodb';
import { getCollection, clientPromise } from './client';
import type { User } from './types';

export class DatabaseService {
  // User operations
  static async getUserById(userId: ObjectId): Promise<User | null> {
    const users = await getCollection<User>('users');
    return users.findOne({ _id: userId });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await getCollection<User>('users');
    return users.findOne({ email });
  }

  static async updateUserLastLogin(userId: ObjectId): Promise<void> {
    const users = await getCollection<User>('users');
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  static async updateUser(userId: ObjectId, updates: Partial<Omit<User, '_id'>>): Promise<void> {
    const users = await getCollection<User>('users');
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );
  }
}

