
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type CreateExpenseInput, type CreateUserInput } from '../schema';
import { getExpenses } from '../handlers/get_expenses';

describe('getExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expenses exist', async () => {
    const result = await getExpenses();
    expect(result).toEqual([]);
  });

  it('should return all expenses', async () => {
    // Create admin user first
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    // Create test expenses
    const expenseData1: CreateExpenseInput = {
      category: 'supplies',
      title: 'Office Supplies',
      description: 'Pens, papers, etc.',
      amount: 150.50,
      expense_date: new Date('2024-01-15'),
      receipt_url: 'http://example.com/receipt1.pdf',
      created_by: adminUser[0].id
    };

    const expenseData2: CreateExpenseInput = {
      category: 'utilities',
      title: 'Electricity Bill',
      description: null,
      amount: 250.75,
      expense_date: new Date('2024-01-10'),
      receipt_url: null,
      created_by: adminUser[0].id
    };

    await db.insert(expensesTable)
      .values({
        ...expenseData1,
        amount: expenseData1.amount.toString(),
        expense_date: expenseData1.expense_date.toISOString().split('T')[0],
        description: expenseData1.description || null,
        receipt_url: expenseData1.receipt_url || null
      })
      .execute();

    await db.insert(expensesTable)
      .values({
        ...expenseData2,
        amount: expenseData2.amount.toString(),
        expense_date: expenseData2.expense_date.toISOString().split('T')[0],
        description: expenseData2.description || null,
        receipt_url: expenseData2.receipt_url || null
      })
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(2);
    
    // Should be ordered by created_at descending (newest first)
    expect(result[0].title).toEqual('Electricity Bill');
    expect(result[0].category).toEqual('utilities');
    expect(result[0].amount).toEqual(250.75);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].description).toBeNull();
    expect(result[0].receipt_url).toBeNull();
    expect(result[0].created_by).toEqual(adminUser[0].id);
    expect(result[0].expense_date).toBeInstanceOf(Date);
    
    expect(result[1].title).toEqual('Office Supplies');
    expect(result[1].category).toEqual('supplies');
    expect(result[1].amount).toEqual(150.50);
    expect(typeof result[1].amount).toBe('number');
    expect(result[1].description).toEqual('Pens, papers, etc.');
    expect(result[1].receipt_url).toEqual('http://example.com/receipt1.pdf');
    expect(result[1].created_by).toEqual(adminUser[0].id);
    expect(result[1].expense_date).toBeInstanceOf(Date);

    // Verify all expenses have required fields
    result.forEach(expense => {
      expect(expense.id).toBeDefined();
      expect(expense.expense_date).toBeInstanceOf(Date);
      expect(expense.created_at).toBeInstanceOf(Date);
      expect(expense.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle multiple expense categories correctly', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    // Create expenses with different categories
    const categories = ['salary', 'utilities', 'supplies', 'maintenance', 'food'];
    
    for (let i = 0; i < categories.length; i++) {
      await db.insert(expensesTable)
        .values({
          category: categories[i] as any,
          title: `${categories[i]} expense`,
          description: `Test ${categories[i]} expense`,
          amount: (100 + i * 50).toString(),
          expense_date: new Date(`2024-01-${10 + i}`).toISOString().split('T')[0],
          receipt_url: null,
          created_by: adminUser[0].id
        })
        .execute();
    }

    const result = await getExpenses();

    expect(result).toHaveLength(5);
    
    // Verify all categories are present
    const resultCategories = result.map(expense => expense.category);
    categories.forEach(category => {
      expect(resultCategories).toContain(category);
    });

    // Verify amounts are properly converted to numbers
    result.forEach(expense => {
      expect(typeof expense.amount).toBe('number');
      expect(expense.amount).toBeGreaterThan(0);
      expect(expense.expense_date).toBeInstanceOf(Date);
    });
  });
});
