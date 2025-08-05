
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentsTable, billsTable, studentsTable, usersTable, classesTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create parent user
    const parentResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Parent User',
        role: 'parent'
      })
      .returning()
      .execute();

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    // Create student
    const studentResult = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01', // Use string format for date column
        parent_id: parentResult[0].id,
        class_id: classResult[0].id,
        enrollment_date: '2024-01-01' // Use string format for date column
      })
      .returning()
      .execute();

    // Create bill
    const billResult = await db.insert(billsTable)
      .values({
        student_id: studentResult[0].id,
        bill_type: 'monthly_fee',
        title: 'January Fee',
        description: 'Monthly fee for January',
        amount: '100.00',
        due_date: '2024-01-31', // Use string format for date column
        status: 'pending'
      })
      .returning()
      .execute();

    return {
      admin: adminResult[0],
      parent: parentResult[0],
      class: classResult[0],
      student: studentResult[0],
      bill: billResult[0]
    };
  };

  const testInput: CreatePaymentInput = {
    bill_id: 1, // Will be overridden in tests
    amount: 100.00,
    payment_method: 'cash',
    payment_date: new Date('2024-01-15'),
    reference_number: 'PAY001',
    notes: 'Cash payment received'
  };

  it('should create a payment successfully', async () => {
    const testData = await createTestData();
    const input = { ...testInput, bill_id: testData.bill.id };

    const result = await createPayment(input);

    // Basic field validation
    expect(result.bill_id).toEqual(testData.bill.id);
    expect(result.amount).toEqual(100.00);
    expect(typeof result.amount).toBe('number');
    expect(result.payment_method).toEqual('cash');
    expect(result.payment_date).toEqual(new Date('2024-01-15'));
    expect(result.status).toEqual('completed');
    expect(result.reference_number).toEqual('PAY001');
    expect(result.notes).toEqual('Cash payment received');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    const testData = await createTestData();
    const input = { ...testInput, bill_id: testData.bill.id };

    const result = await createPayment(input);

    // Query payment from database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].bill_id).toEqual(testData.bill.id);
    expect(parseFloat(payments[0].amount)).toEqual(100.00);
    expect(payments[0].payment_method).toEqual('cash');
    expect(payments[0].status).toEqual('completed');
    expect(payments[0].reference_number).toEqual('PAY001');
    expect(payments[0].notes).toEqual('Cash payment received');
  });

  it('should update bill status to paid', async () => {
    const testData = await createTestData();
    const input = { ...testInput, bill_id: testData.bill.id };

    await createPayment(input);

    // Query updated bill
    const bills = await db.select()
      .from(billsTable)
      .where(eq(billsTable.id, testData.bill.id))
      .execute();

    expect(bills).toHaveLength(1);
    expect(bills[0].status).toEqual('paid');
    expect(bills[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent bill', async () => {
    const input = { ...testInput, bill_id: 999 };

    await expect(createPayment(input)).rejects.toThrow(/Bill with id 999 not found/i);
  });

  it('should handle payment with minimal data', async () => {
    const testData = await createTestData();
    const minimalInput: CreatePaymentInput = {
      bill_id: testData.bill.id,
      amount: 50.00,
      payment_method: 'bank_transfer',
      payment_date: new Date('2024-01-20')
    };

    const result = await createPayment(minimalInput);

    expect(result.amount).toEqual(50.00);
    expect(result.payment_method).toEqual('bank_transfer');
    expect(result.reference_number).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.receipt_url).toBeNull();
    expect(result.status).toEqual('completed');
  });
});
