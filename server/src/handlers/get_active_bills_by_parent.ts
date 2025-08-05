
import { db } from '../db';
import { billsTable, studentsTable } from '../db/schema';
import { type Bill } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export async function getActiveBillsByParent(parentId: number): Promise<Bill[]> {
  try {
    // Query bills for all children of the parent
    // Join students table to filter by parent_id
    // Filter for active bills (status != 'paid' and != 'cancelled')
    const results = await db.select({
      id: billsTable.id,
      student_id: billsTable.student_id,
      bill_type: billsTable.bill_type,
      title: billsTable.title,
      description: billsTable.description,
      amount: billsTable.amount,
      due_date: billsTable.due_date,
      status: billsTable.status,
      created_at: billsTable.created_at,
      updated_at: billsTable.updated_at
    })
    .from(billsTable)
    .innerJoin(studentsTable, eq(billsTable.student_id, studentsTable.id))
    .where(
      and(
        eq(studentsTable.parent_id, parentId),
        ne(billsTable.status, 'paid'),
        ne(billsTable.status, 'cancelled')
      )
    )
    .execute();

    // Convert numeric and date fields to proper types
    return results.map(bill => ({
      ...bill,
      amount: parseFloat(bill.amount),
      due_date: new Date(bill.due_date)
    }));
  } catch (error) {
    console.error('Failed to fetch active bills by parent:', error);
    throw error;
  }
}
