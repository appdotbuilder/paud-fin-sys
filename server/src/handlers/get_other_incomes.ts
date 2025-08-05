
import { db } from '../db';
import { otherIncomesTable, usersTable } from '../db/schema';
import { type OtherIncome } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOtherIncomes(): Promise<OtherIncome[]> {
  try {
    // Join with users table to get creator information
    const results = await db.select()
      .from(otherIncomesTable)
      .innerJoin(usersTable, eq(otherIncomesTable.created_by, usersTable.id))
      .execute();

    // Convert numeric fields and structure the response
    return results.map(result => ({
      id: result.other_incomes.id,
      category: result.other_incomes.category,
      title: result.other_incomes.title,
      description: result.other_incomes.description,
      amount: parseFloat(result.other_incomes.amount), // Convert numeric to number
      income_date: new Date(result.other_incomes.income_date), // Convert string to Date
      created_by: result.other_incomes.created_by,
      created_at: result.other_incomes.created_at,
      updated_at: result.other_incomes.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch other incomes:', error);
    throw error;
  }
}
