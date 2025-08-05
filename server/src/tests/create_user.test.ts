
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  role: 'parent',
  is_active: true
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.role).toEqual('parent');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(20);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].role).toEqual('parent');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].password_hash).toBeDefined();
  });

  it('should use default is_active value when not provided', async () => {
    const inputWithoutIsActive: CreateUserInput = {
      email: 'test2@example.com',
      password: 'password123',
      full_name: 'Test User 2',
      role: 'admin'
    };

    const result = await createUser(inputWithoutIsActive);

    expect(result.is_active).toEqual(true);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      password: 'different123',
      full_name: 'Different User',
      role: 'admin'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should create admin users correctly', async () => {
    const adminInput: CreateUserInput = {
      email: 'admin@example.com',
      password: 'adminpass123',
      full_name: 'Admin User',
      role: 'admin',
      is_active: true
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
    expect(result.full_name).toEqual('Admin User');
  });

  it('should verify password is properly hashed', async () => {
    const result = await createUser(testInput);

    // Verify password can be verified (but not retrieved as plain text)
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isWrong = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isWrong).toBe(false);
  });
});
