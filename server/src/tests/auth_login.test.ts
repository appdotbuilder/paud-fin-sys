
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/auth_login';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';

// Simple JWT decoder for testing
function decodeJWT(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  
  const payload = JSON.parse(atob(parts[1]));
  return payload;
}

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'testpassword123', // In production, this would be hashed
  full_name: 'Test User',
  role: 'admin' as const,
  is_active: true
};

const testInput: LoginInput = {
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate valid user credentials', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(testInput);

    // Verify response structure
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.full_name).toEqual('Test User');
    expect(result.user.role).toEqual('admin');
    expect(result.user.is_active).toBe(true);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
  });

  it('should generate valid JWT token', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(testInput);

    // Verify JWT token can be decoded
    const decoded = decodeJWT(result.token);
    expect(decoded.email).toEqual('test@example.com');
    expect(decoded.role).toEqual('admin');
    expect(decoded.userId).toBeDefined();
    expect(decoded.exp).toBeDefined(); // Token expiration
    expect(decoded.iat).toBeDefined(); // Token issued at
  });

  it('should reject invalid email', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'testpassword123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should reject invalid password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should reject inactive user', async () => {
    // Create inactive test user
    await db.insert(usersTable)
      .values({
        ...testUser,
        is_active: false
      })
      .execute();

    await expect(loginUser(testInput)).rejects.toThrow(/account is deactivated/i);
  });

  it('should authenticate parent role user', async () => {
    // Create parent user
    const parentUser = {
      ...testUser,
      email: 'parent@example.com',
      role: 'parent' as const
    };

    await db.insert(usersTable)
      .values(parentUser)
      .execute();

    const parentInput: LoginInput = {
      email: 'parent@example.com',
      password: 'testpassword123'
    };

    const result = await loginUser(parentInput);

    expect(result.user.role).toEqual('parent');
    expect(result.user.email).toEqual('parent@example.com');
    
    // Verify JWT contains correct role
    const decoded = decodeJWT(result.token);
    expect(decoded.role).toEqual('parent');
  });
});
