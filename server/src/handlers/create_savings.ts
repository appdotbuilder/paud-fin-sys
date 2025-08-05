
import { db } from '../db';
import { savingsTable, studentsTable } from '../db/schema';
import { type CreateSavingsInput, type Savings } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const createSavings = async (input: CreateSavingsInput): Promise<Savings> => {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with id ${input.student_id} not found`);
    }

    // Get current balance by finding the most recent transaction
    const lastTransaction = await db.select()
      .from(savingsTable)
      .where(eq(savingsTable.student_id, input.student_id))
      .orderBy(desc(savingsTable.created_at))
      .limit(1)
      .execute();

    const currentBalance = lastTransaction.length > 0 
      ? parseFloat(lastTransaction[0].balance_after) 
      : 0;

    // Calculate new balance
    let newBalance: number;
    if (input.transaction_type === 'deposit') {
      newBalance = currentBalance + input.amount;
    } else { // withdrawal
      newBalance = currentBalance - input.amount;
      
      // Validate sufficient funds for withdrawal
      if (newBalance < 0) {
        throw new Error('Insufficient funds for withdrawal');
      }
    }

    // Insert savings transaction
    const result = await db.insert(savingsTable)
      .values({
        student_id: input.student_id,
        transaction_type: input.transaction_type,
        amount: input.amount.toString(),
        balance_after: newBalance.toString(),
        description: input.description || null,
        transaction_date: input.transaction_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount),
      balance_after: parseFloat(transaction.balance_after)
    };
  } catch (error) {
    console.error('Savings transaction creation failed:', error);
    throw error;
  }
};
