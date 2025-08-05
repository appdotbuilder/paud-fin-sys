
import { db } from '../db';
import { otherIncomesTable } from '../db/schema';
import { type CreateOtherIncomeInput, type OtherIncome } from '../schema';

export const createOtherIncome = async (input: CreateOtherIncomeInput): Promise<OtherIncome> => {
  try {
    // Insert other income record
    const result = await db.insert(otherIncomesTable)
      .values({
        category: input.category,
        title: input.title,
        description: input.description || null,
        amount: input.amount.toString(), // Convert number to string for numeric column
        income_date: input.income_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        created_by: input.created_by
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and ensure date is Date object
    const otherIncome = result[0];
    return {
      ...otherIncome,
      amount: parseFloat(otherIncome.amount), // Convert string back to number
      income_date: new Date(otherIncome.income_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Other income creation failed:', error);
    throw error;
  }
};
