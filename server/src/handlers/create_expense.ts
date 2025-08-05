
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput, type Expense } from '../schema';

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  try {
    // Insert expense record
    const result = await db.insert(expensesTable)
      .values({
        category: input.category,
        title: input.title,
        description: input.description || null,
        amount: input.amount.toString(), // Convert number to string for numeric column
        expense_date: input.expense_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        receipt_url: input.receipt_url || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const expense = result[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount), // Convert string back to number
      expense_date: new Date(expense.expense_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Expense creation failed:', error);
    throw error;
  }
};
