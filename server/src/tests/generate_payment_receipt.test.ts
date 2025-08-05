
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, billsTable, paymentsTable } from '../db/schema';
import { generatePaymentReceipt } from '../handlers/generate_payment_receipt';

describe('generatePaymentReceipt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate receipt URL for valid payment', async () => {
    // Create test data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'John Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Grade 1A',
        description: 'First grade class',
        monthly_fee: '150.00'
      })
      .returning()
      .execute();

    const [student] = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Jane Student',
        date_of_birth: '2015-05-15',
        parent_id: user.id,
        class_id: testClass.id,
        enrollment_date: '2024-01-15'
      })
      .returning()
      .execute();

    const [bill] = await db.insert(billsTable)
      .values({
        student_id: student.id,
        bill_type: 'monthly_fee',
        title: 'January 2024 Monthly Fee',
        description: 'Monthly tuition fee',
        amount: '150.00',
        due_date: '2024-01-31'
      })
      .returning()
      .execute();

    const [payment] = await db.insert(paymentsTable)
      .values({
        bill_id: bill.id,
        amount: '150.00',
        payment_method: 'bank_transfer',
        payment_date: new Date('2024-01-20'),
        status: 'completed',
        reference_number: 'TXN123456'
      })
      .returning()
      .execute();

    const result = await generatePaymentReceipt(payment.id);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('payment_');
    expect(result).toContain('receipt.pdf');
    expect(result).toContain(payment.id.toString());
  });

  it('should throw error for non-existent payment', async () => {
    const nonExistentPaymentId = 999;

    await expect(generatePaymentReceipt(nonExistentPaymentId))
      .rejects.toThrow(/Payment with ID 999 not found/i);
  });

  it('should handle payment with minimal data', async () => {
    // Create test data with minimal required fields
    const [user] = await db.insert(usersTable)
      .values({
        email: 'minimal@test.com',
        password_hash: 'hashed_password',
        full_name: 'Minimal Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Basic Class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    const [student] = await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Basic Student',
        date_of_birth: '2016-03-10',
        parent_id: user.id,
        class_id: testClass.id,
        enrollment_date: '2024-02-01'
      })
      .returning()
      .execute();

    const [bill] = await db.insert(billsTable)
      .values({
        student_id: student.id,
        bill_type: 'registration',
        title: 'Registration Fee',
        amount: '50.00',
        due_date: '2024-02-15'
      })
      .returning()
      .execute();

    const [payment] = await db.insert(paymentsTable)
      .values({
        bill_id: bill.id,
        amount: '50.00',
        payment_method: 'cash',
        payment_date: new Date('2024-02-10'),
        status: 'completed'
      })
      .returning()
      .execute();

    const result = await generatePaymentReceipt(payment.id);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain(payment.id.toString());
  });

  it('should handle payment with all optional fields filled', async () => {
    // Create test data with all fields including optional ones
    const [user] = await db.insert(usersTable)
      .values({
        email: 'complete@test.com',
        password_hash: 'hashed_password',
        full_name: 'Complete Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Premium Class',
        description: 'Premium education class',
        monthly_fee: '200.00'
      })
      .returning()
      .execute();

    const [student] = await db.insert(studentsTable)
      .values({
        student_id: 'STU003',
        full_name: 'Premium Student',
        date_of_birth: '2014-08-20',
        parent_id: user.id,
        class_id: testClass.id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    const [bill] = await db.insert(billsTable)
      .values({
        student_id: student.id,
        bill_type: 'activity',
        title: 'Field Trip Fee',
        description: 'Annual field trip to science museum',
        amount: '75.50',
        due_date: '2024-03-01'
      })
      .returning()
      .execute();

    const [payment] = await db.insert(paymentsTable)
      .values({
        bill_id: bill.id,
        amount: '75.50',
        payment_method: 'credit_card',
        payment_date: new Date('2024-02-25'),
        status: 'completed',
        reference_number: 'CC789012',
        notes: 'Paid via online portal',
        receipt_url: 'https://existing-receipt.com/receipt.pdf'
      })
      .returning()
      .execute();

    const result = await generatePaymentReceipt(payment.id);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain(payment.id.toString());
  });
});
