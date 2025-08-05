
import { db } from '../db';
import { paymentsTable, billsTable, studentsTable } from '../db/schema';
import { type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPaymentHistoryByParent(parentId: number): Promise<Payment[]> {
  try {
    // Query payments for all children of this parent
    // Join: payments -> bills -> students (filtered by parent_id)
    const results = await db.select()
      .from(paymentsTable)
      .innerJoin(billsTable, eq(paymentsTable.bill_id, billsTable.id))
      .innerJoin(studentsTable, eq(billsTable.student_id, studentsTable.id))
      .where(eq(studentsTable.parent_id, parentId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      ...result.payments,
      amount: parseFloat(result.payments.amount)
    }));
  } catch (error) {
    console.error('Get payment history by parent failed:', error);
    throw error;
  }
}
