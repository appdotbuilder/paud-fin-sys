
import { db } from '../db';
import { savingsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type Savings } from '../schema';

export async function getSavingsByStudent(studentId: number): Promise<Savings[]> {
  try {
    // Query savings transactions for the student, ordered by most recent first
    const results = await db.select()
      .from(savingsTable)
      .where(eq(savingsTable.student_id, studentId))
      .orderBy(desc(savingsTable.transaction_date))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(savings => ({
      ...savings,
      amount: parseFloat(savings.amount),
      balance_after: parseFloat(savings.balance_after)
    }));
  } catch (error) {
    console.error('Get savings by student failed:', error);
    throw error;
  }
}
