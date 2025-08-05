
import { db } from '../db';
import { savingsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getStudentSavingsBalance(studentId: number): Promise<number> {
  try {
    // Get the most recent transaction for this student to get current balance
    const result = await db.select()
      .from(savingsTable)
      .where(eq(savingsTable.student_id, studentId))
      .orderBy(desc(savingsTable.created_at))
      .limit(1)
      .execute();

    // If no transactions exist, balance is 0
    if (result.length === 0) {
      return 0;
    }

    // Return the balance_after from the most recent transaction
    return parseFloat(result[0].balance_after);
  } catch (error) {
    console.error('Failed to get student savings balance:', error);
    throw error;
  }
}
