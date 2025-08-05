
import { db } from '../db';
import { billsTable } from '../db/schema';
import { type Bill } from '../schema';
import { eq } from 'drizzle-orm';

export const getBillsByStudent = async (studentId: number): Promise<Bill[]> => {
  try {
    const results = await db.select()
      .from(billsTable)
      .where(eq(billsTable.student_id, studentId))
      .execute();

    // Convert numeric and date fields back to proper types before returning
    return results.map(bill => ({
      ...bill,
      amount: parseFloat(bill.amount),
      due_date: new Date(bill.due_date)
    }));
  } catch (error) {
    console.error('Failed to fetch bills by student:', error);
    throw error;
  }
};
