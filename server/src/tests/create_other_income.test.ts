
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { otherIncomesTable, usersTable } from '../db/schema';
import { type CreateOtherIncomeInput } from '../schema';
import { createOtherIncome } from '../handlers/create_other_income';
import { eq } from 'drizzle-orm';

describe('createOtherIncome', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an other income record', async () => {
    // Create a user first for the created_by foreign key
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin'
      })
      .returning()
      .execute();

    const testInput: CreateOtherIncomeInput = {
      category: 'donation',
      title: 'Community Donation',
      description: 'Donation from local community',
      amount: 1500.75,
      income_date: new Date('2024-01-15'),
      created_by: userResult[0].id
    };

    const result = await createOtherIncome(testInput);

    // Basic field validation
    expect(result.category).toEqual('donation');
    expect(result.title).toEqual('Community Donation');
    expect(result.description).toEqual('Donation from local community');
    expect(result.amount).toEqual(1500.75);
    expect(typeof result.amount).toBe('number');
    expect(result.income_date).toEqual(new Date('2024-01-15'));
    expect(result.created_by).toEqual(userResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save other income to database', async () => {
    // Create a user first for the created_by foreign key
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin'
      })
      .returning()
      .execute();

    const testInput: CreateOtherIncomeInput = {
      category: 'fundraising',
      title: 'School Fundraiser',
      description: 'Annual school fundraising event',
      amount: 2500.00,
      income_date: new Date('2024-02-01'),
      created_by: userResult[0].id
    };

    const result = await createOtherIncome(testInput);

    // Query using proper drizzle syntax
    const otherIncomes = await db.select()
      .from(otherIncomesTable)
      .where(eq(otherIncomesTable.id, result.id))
      .execute();

    expect(otherIncomes).toHaveLength(1);
    expect(otherIncomes[0].category).toEqual('fundraising');
    expect(otherIncomes[0].title).toEqual('School Fundraiser');
    expect(otherIncomes[0].description).toEqual('Annual school fundraising event');
    expect(parseFloat(otherIncomes[0].amount)).toEqual(2500.00);
    expect(new Date(otherIncomes[0].income_date)).toEqual(new Date('2024-02-01'));
    expect(otherIncomes[0].created_by).toEqual(userResult[0].id);
    expect(otherIncomes[0].created_at).toBeInstanceOf(Date);
    expect(otherIncomes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional description field', async () => {
    // Create a user first for the created_by foreign key
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin'
      })
      .returning()
      .execute();

    const testInput: CreateOtherIncomeInput = {
      category: 'government_aid',
      title: 'Government Grant',
      amount: 5000.00,
      income_date: new Date('2024-03-01'),
      created_by: userResult[0].id
    };

    const result = await createOtherIncome(testInput);

    expect(result.description).toBeNull();
    expect(result.category).toEqual('government_aid');
    expect(result.title).toEqual('Government Grant');
    expect(result.amount).toEqual(5000.00);
  });

  it('should handle different income categories', async () => {
    // Create a user first for the created_by foreign key
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin'
      })
      .returning()
      .execute();

    const categories = ['donation', 'fundraising', 'government_aid', 'investment', 'other'] as const;

    for (const category of categories) {
      const testInput: CreateOtherIncomeInput = {
        category,
        title: `Test ${category} income`,
        description: `Income from ${category}`,
        amount: 1000.00,
        income_date: new Date('2024-01-01'),
        created_by: userResult[0].id
      };

      const result = await createOtherIncome(testInput);
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`Test ${category} income`);
    }
  });
});
