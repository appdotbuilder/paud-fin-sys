
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, otherIncomesTable } from '../db/schema';
import { type CreateUserInput, type CreateOtherIncomeInput } from '../schema';
import { getOtherIncomes } from '../handlers/get_other_incomes';

// Test data
const testUser: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Test Admin',
  role: 'admin',
  is_active: true
};

const testIncome: CreateOtherIncomeInput = {
  category: 'donation',
  title: 'Test Donation',
  description: 'A test donation',
  amount: 1000.50,
  income_date: new Date('2024-01-15'),
  created_by: 1 // Will be set after user creation
};

describe('getOtherIncomes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no incomes exist', async () => {
    const result = await getOtherIncomes();
    
    expect(result).toEqual([]);
  });

  it('should return all other income records', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        role: testUser.role,
        is_active: testUser.is_active
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test income
    await db.insert(otherIncomesTable)
      .values({
        category: testIncome.category,
        title: testIncome.title,
        description: testIncome.description,
        amount: testIncome.amount.toString(), // Convert to string for numeric column
        income_date: '2024-01-15', // Use string format for date column
        created_by: userId
      })
      .execute();

    const result = await getOtherIncomes();

    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual('donation');
    expect(result[0].title).toEqual('Test Donation');
    expect(result[0].description).toEqual('A test donation');
    expect(result[0].amount).toEqual(1000.50);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].income_date).toEqual(new Date('2024-01-15'));
    expect(result[0].created_by).toEqual(userId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple income records with different categories', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        role: testUser.role,
        is_active: testUser.is_active
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple incomes
    const incomes = [
      {
        category: 'donation' as const,
        title: 'First Donation',
        description: null,
        amount: '500.00',
        income_date: '2024-01-10',
        created_by: userId
      },
      {
        category: 'fundraising' as const,
        title: 'School Fair',
        description: 'Annual fundraising event',
        amount: '2500.75',
        income_date: '2024-01-20',
        created_by: userId
      }
    ];

    await db.insert(otherIncomesTable)
      .values(incomes)
      .execute();

    const result = await getOtherIncomes();

    expect(result).toHaveLength(2);
    
    // Check first income
    const donation = result.find(income => income.category === 'donation');
    expect(donation).toBeDefined();
    expect(donation!.title).toEqual('First Donation');
    expect(donation!.amount).toEqual(500);
    expect(donation!.description).toBeNull();

    // Check second income
    const fundraising = result.find(income => income.category === 'fundraising');
    expect(fundraising).toBeDefined();
    expect(fundraising!.title).toEqual('School Fair');
    expect(fundraising!.amount).toEqual(2500.75);
    expect(fundraising!.description).toEqual('Annual fundraising event');
  });

  it('should handle incomes created by different users', async () => {
    // Create two test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'admin1@test.com',
          password_hash: 'hashed_password',
          full_name: 'Admin One',
          role: 'admin',
          is_active: true
        },
        {
          email: 'admin2@test.com',
          password_hash: 'hashed_password',
          full_name: 'Admin Two',
          role: 'admin',
          is_active: true
        }
      ])
      .returning()
      .execute();

    // Create incomes by different users
    const incomes = [
      {
        category: 'donation' as const,
        title: 'Income by Admin 1',
        description: null,
        amount: '100.00',
        income_date: '2024-01-15',
        created_by: users[0].id
      },
      {
        category: 'investment' as const,
        title: 'Income by Admin 2',
        description: null,
        amount: '200.00',
        income_date: '2024-01-16',
        created_by: users[1].id
      }
    ];

    await db.insert(otherIncomesTable)
      .values(incomes)
      .execute();

    const result = await getOtherIncomes();

    expect(result).toHaveLength(2);
    expect(result[0].created_by).toEqual(users[0].id);
    expect(result[1].created_by).toEqual(users[1].id);
    expect(result[0].amount).toEqual(100);
    expect(result[1].amount).toEqual(200);
  });
});
