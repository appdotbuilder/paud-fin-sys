
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type CreateExpenseInput, type ExpenseCategory } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

describe('createExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let adminUserId: number;

  beforeEach(async () => {
    // Create an admin user for testing
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@school.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin'
      })
      .returning()
      .execute();
    
    adminUserId = adminResult[0].id;
  });

  const testInput: CreateExpenseInput = {
    category: 'supplies',
    title: 'Office Supplies',
    description: 'Monthly office supplies purchase',
    amount: 250.75,
    expense_date: new Date('2024-01-15'),
    receipt_url: 'https://example.com/receipt.pdf',
    created_by: 0 // Will be set to adminUserId in tests
  };

  it('should create an expense', async () => {
    const input = { ...testInput, created_by: adminUserId };
    const result = await createExpense(input);

    // Basic field validation
    expect(result.category).toEqual('supplies');
    expect(result.title).toEqual('Office Supplies');
    expect(result.description).toEqual('Monthly office supplies purchase');
    expect(result.amount).toEqual(250.75);
    expect(typeof result.amount).toBe('number');
    expect(result.expense_date).toEqual(new Date('2024-01-15'));
    expect(result.receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(result.created_by).toEqual(adminUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    const input = { ...testInput, created_by: adminUserId };
    const result = await createExpense(input);

    // Query database to verify persistence
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].category).toEqual('supplies');
    expect(expenses[0].title).toEqual('Office Supplies');
    expect(expenses[0].description).toEqual('Monthly office supplies purchase');
    expect(parseFloat(expenses[0].amount)).toEqual(250.75);
    expect(new Date(expenses[0].expense_date)).toEqual(new Date('2024-01-15'));
    expect(expenses[0].receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(expenses[0].created_by).toEqual(adminUserId);
    expect(expenses[0].created_at).toBeInstanceOf(Date);
    expect(expenses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    const minimalInput: CreateExpenseInput = {
      category: 'utilities',
      title: 'Electricity Bill',
      amount: 150.00,
      expense_date: new Date('2024-01-20'),
      created_by: adminUserId
    };

    const result = await createExpense(minimalInput);

    expect(result.category).toEqual('utilities');
    expect(result.title).toEqual('Electricity Bill');
    expect(result.description).toBeNull();
    expect(result.amount).toEqual(150.00);
    expect(result.expense_date).toEqual(new Date('2024-01-20'));
    expect(result.receipt_url).toBeNull();
    expect(result.created_by).toEqual(adminUserId);
    expect(result.id).toBeDefined();
  });

  it('should handle different expense categories', async () => {
    const categories: ExpenseCategory[] = ['salary', 'utilities', 'supplies', 'maintenance', 'food', 'transportation', 'marketing', 'training', 'other'];
    
    for (const category of categories) {
      const input: CreateExpenseInput = {
        category: category,
        title: `Test ${category} expense`,
        amount: 100.00,
        expense_date: new Date('2024-01-15'),
        created_by: adminUserId
      };

      const result = await createExpense(input);
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`Test ${category} expense`);
    }
  });

  it('should handle numeric precision correctly', async () => {
    const precisionInput: CreateExpenseInput = {
      category: 'other',
      title: 'Precision Test',
      amount: 99.99,
      expense_date: new Date('2024-01-15'),
      created_by: adminUserId
    };

    const result = await createExpense(precisionInput);
    expect(result.amount).toEqual(99.99);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(parseFloat(expenses[0].amount)).toEqual(99.99);
  });
});
