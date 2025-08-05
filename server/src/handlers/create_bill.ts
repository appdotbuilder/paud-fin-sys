
import { db } from '../db';
import { billsTable, studentsTable } from '../db/schema';
import { type CreateBillInput, type Bill } from '../schema';
import { eq } from 'drizzle-orm';

export const createBill = async (input: CreateBillInput): Promise<Bill> => {
  try {
    // Verify student exists
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (students.length === 0) {
      throw new Error(`Student with id ${input.student_id} not found`);
    }

    // Insert bill record
    const result = await db.insert(billsTable)
      .values({
        student_id: input.student_id,
        bill_type: input.bill_type,
        title: input.title,
        description: input.description || null,
        amount: input.amount.toString(), // Convert number to string for numeric column
        due_date: input.due_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string for date column
      })
      .returning()
      .execute();

    // Convert fields back to correct types before returning
    const bill = result[0];
    return {
      ...bill,
      amount: parseFloat(bill.amount), // Convert string back to number
      due_date: new Date(bill.due_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Bill creation failed:', error);
    throw error;
  }
};
