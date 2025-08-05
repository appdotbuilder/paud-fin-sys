
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, billsTable, paymentsTable } from '../db/schema';
import { type CreateUserInput, type CreateClassInput, type CreateStudentInput, type CreateBillInput, type CreatePaymentInput } from '../schema';
import { getPaymentHistoryByParent } from '../handlers/get_payment_history_by_parent';

describe('getPaymentHistoryByParent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return payment history for parent children', async () => {
    // Create parent user
    const parentResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Grade 1',
        description: 'First grade class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create student
    const studentResult = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2015-01-01',
        parent_id: parentId,
        class_id: classId,
        enrollment_date: '2023-01-01',
        is_active: true
      })
      .returning()
      .execute();
    const studentId = studentResult[0].id;

    // Create bill
    const billResult = await db.insert(billsTable)
      .values({
        student_id: studentId,
        bill_type: 'monthly_fee',
        title: 'January 2024 Fee',
        description: 'Monthly tuition fee',
        amount: '100.00',
        due_date: '2024-01-15',
        status: 'paid'
      })
      .returning()
      .execute();
    const billId = billResult[0].id;

    // Create payment
    const paymentDate = new Date('2024-01-10');
    await db.insert(paymentsTable)
      .values({
        bill_id: billId,
        amount: '100.00',
        payment_method: 'bank_transfer',
        payment_date: paymentDate,
        status: 'completed',
        reference_number: 'REF001',
        notes: 'Payment completed'
      })
      .execute();

    const result = await getPaymentHistoryByParent(parentId);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(100.00);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].payment_method).toEqual('bank_transfer');
    expect(result[0].status).toEqual('completed');
    expect(result[0].reference_number).toEqual('REF001');
    expect(result[0].payment_date).toEqual(paymentDate);
    expect(result[0].id).toBeDefined();
  });

  it('should return multiple payments for multiple children', async () => {
    // Create parent user
    const parentResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Grade 1',
        description: 'First grade class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create two students
    const student1Result = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student 1',
        date_of_birth: '2015-01-01',
        parent_id: parentId,
        class_id: classId,
        enrollment_date: '2023-01-01',
        is_active: true
      })
      .returning()
      .execute();

    const student2Result = await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Test Student 2',
        date_of_birth: '2016-01-01',
        parent_id: parentId,
        class_id: classId,
        enrollment_date: '2023-01-01',
        is_active: true
      })
      .returning()
      .execute();

    // Create bills for both students
    const bill1Result = await db.insert(billsTable)
      .values({
        student_id: student1Result[0].id,
        bill_type: 'monthly_fee',
        title: 'January 2024 Fee - Student 1',
        amount: '100.00',
        due_date: '2024-01-15',
        status: 'paid'
      })
      .returning()
      .execute();

    const bill2Result = await db.insert(billsTable)
      .values({
        student_id: student2Result[0].id,
        bill_type: 'monthly_fee',
        title: 'January 2024 Fee - Student 2',
        amount: '100.00',
        due_date: '2024-01-15',
        status: 'paid'
      })
      .returning()
      .execute();

    // Create payments for both bills
    await db.insert(paymentsTable)
      .values({
        bill_id: bill1Result[0].id,
        amount: '100.00',
        payment_method: 'cash',
        payment_date: new Date('2024-01-10'),
        status: 'completed'
      })
      .execute();

    await db.insert(paymentsTable)
      .values({
        bill_id: bill2Result[0].id,
        amount: '75.50',
        payment_method: 'credit_card',
        payment_date: new Date('2024-01-12'),
        status: 'completed'
      })
      .execute();

    const result = await getPaymentHistoryByParent(parentId);

    expect(result).toHaveLength(2);
    expect(result.some(p => p.amount === 100.00 && p.payment_method === 'cash')).toBe(true);
    expect(result.some(p => p.amount === 75.5 && p.payment_method === 'credit_card')).toBe(true);
    result.forEach(payment => {
      expect(typeof payment.amount).toBe('number');
      expect(payment.status).toEqual('completed');
    });
  });

  it('should return empty array for parent with no children', async () => {
    // Create parent user
    const parentResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    const result = await getPaymentHistoryByParent(parentId);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for nonexistent parent', async () => {
    const result = await getPaymentHistoryByParent(999999);

    expect(result).toHaveLength(0);
  });

  it('should only return payments for specified parent children', async () => {
    // Create two parent users
    const parent1Result = await db.insert(usersTable)
      .values({
        email: 'parent1@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent 1',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const parent2Result = await db.insert(usersTable)
      .values({
        email: 'parent2@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent 2',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Grade 1',
        description: 'First grade class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create students for each parent
    const student1Result = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Student of Parent 1',
        date_of_birth: '2015-01-01',
        parent_id: parent1Result[0].id,
        class_id: classId,
        enrollment_date: '2023-01-01',
        is_active: true
      })
      .returning()
      .execute();

    const student2Result = await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Student of Parent 2',
        date_of_birth: '2016-01-01',
        parent_id: parent2Result[0].id,
        class_id: classId,
        enrollment_date: '2023-01-01',
        is_active: true
      })
      .returning()
      .execute();

    // Create bills and payments for both students
    const bill1Result = await db.insert(billsTable)
      .values({
        student_id: student1Result[0].id,
        bill_type: 'monthly_fee',
        title: 'Fee for Parent 1 Child',
        amount: '100.00',
        due_date: '2024-01-15',
        status: 'paid'
      })
      .returning()
      .execute();

    const bill2Result = await db.insert(billsTable)
      .values({
        student_id: student2Result[0].id,
        bill_type: 'monthly_fee',
        title: 'Fee for Parent 2 Child',
        amount: '150.00',
        due_date: '2024-01-15',
        status: 'paid'
      })
      .returning()
      .execute();

    await db.insert(paymentsTable)
      .values({
        bill_id: bill1Result[0].id,
        amount: '100.00',
        payment_method: 'cash',
        payment_date: new Date('2024-01-10'),
        status: 'completed'
      })
      .execute();

    await db.insert(paymentsTable)
      .values({
        bill_id: bill2Result[0].id,
        amount: '150.00',
        payment_method: 'bank_transfer',
        payment_date: new Date('2024-01-12'),
        status: 'completed'
      })
      .execute();

    // Get payment history for parent 1 only
    const result = await getPaymentHistoryByParent(parent1Result[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(100.00);
    expect(result[0].payment_method).toEqual('cash');
  });
});
