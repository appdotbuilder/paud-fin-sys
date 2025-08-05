
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type Expense } from '../schema';
import { desc } from 'drizzle-orm';

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const results = await db.select()
      .from(expensesTable)
      .orderBy(desc(expensesTable.created_at))
      .execute();

    // Convert numeric fields and date fields back to correct types
    return results.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount),
      expense_date: new Date(expense.expense_date)
    }));
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    throw error;
  }
};
