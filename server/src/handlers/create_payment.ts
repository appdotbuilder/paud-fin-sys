
import { db } from '../db';
import { paymentsTable, billsTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  try {
    // First, verify the bill exists and get its current status
    const bill = await db.select()
      .from(billsTable)
      .where(eq(billsTable.id, input.bill_id))
      .execute();

    if (bill.length === 0) {
      throw new Error(`Bill with id ${input.bill_id} not found`);
    }

    // Insert payment record
    const result = await db.insert(paymentsTable)
      .values({
        bill_id: input.bill_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        payment_method: input.payment_method,
        payment_date: input.payment_date,
        status: 'completed', // Default to completed for successful payment creation
        reference_number: input.reference_number || null,
        notes: input.notes || null,
        receipt_url: null // Could be generated later
      })
      .returning()
      .execute();

    // Update bill status to paid
    await db.update(billsTable)
      .set({ 
        status: 'paid',
        updated_at: new Date()
      })
      .where(eq(billsTable.id, input.bill_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    const payment = result[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
};
