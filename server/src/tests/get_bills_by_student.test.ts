
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, billsTable } from '../db/schema';
import { getBillsByStudent } from '../handlers/get_bills_by_student';

describe('getBillsByStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all bills for a specific student', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: userResult[0].id,
        class_id: classResult[0].id,
        enrollment_date: '2024-01-01',
        is_active: true
      })
      .returning()
      .execute();

    // Create multiple bills for the student
    await db.insert(billsTable)
      .values({
        student_id: studentResult[0].id,
        bill_type: 'monthly_fee',
        title: 'January Monthly Fee',
        description: 'Monthly fee for January',
        amount: '100.00',
        due_date: '2024-01-31',
        status: 'pending'
      })
      .execute();

    await db.insert(billsTable)
      .values({
        student_id: studentResult[0].id,
        bill_type: 'registration',
        title: 'Registration Fee',
        description: 'Annual registration fee',
        amount: '50.00',
        due_date: '2024-02-15',
        status: 'paid'
      })
      .execute();

    const bills = await getBillsByStudent(studentResult[0].id);

    expect(bills).toHaveLength(2);
    expect(bills[0].student_id).toEqual(studentResult[0].id);
    expect(bills[1].student_id).toEqual(studentResult[0].id);
    
    // Verify numeric conversion
    expect(typeof bills[0].amount).toBe('number');
    expect(typeof bills[1].amount).toBe('number');
    expect(bills[0].amount).toEqual(100.00);
    expect(bills[1].amount).toEqual(50.00);

    // Verify date conversion
    expect(bills[0].due_date).toBeInstanceOf(Date);
    expect(bills[1].due_date).toBeInstanceOf(Date);
  });

  it('should return empty array when student has no bills', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Student No Bills',
        date_of_birth: '2010-01-01',
        parent_id: userResult[0].id,
        class_id: classResult[0].id,
        enrollment_date: '2024-01-01',
        is_active: true
      })
      .returning()
      .execute();

    const bills = await getBillsByStudent(studentResult[0].id);

    expect(bills).toHaveLength(0);
  });

  it('should return bills with correct status values', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        student_id: 'STU003',
        full_name: 'Test Student Status',
        date_of_birth: '2010-01-01',
        parent_id: userResult[0].id,
        class_id: classResult[0].id,
        enrollment_date: '2024-01-01',
        is_active: true
      })
      .returning()
      .execute();

    // Create bills with different statuses
    await db.insert(billsTable)
      .values([
        {
          student_id: studentResult[0].id,
          bill_type: 'monthly_fee',
          title: 'Pending Bill',
          amount: '100.00',
          due_date: '2024-03-31',
          status: 'pending'
        },
        {
          student_id: studentResult[0].id,
          bill_type: 'activity',
          title: 'Paid Bill',
          amount: '25.00',
          due_date: '2024-03-15',
          status: 'paid'
        },
        {
          student_id: studentResult[0].id,
          bill_type: 'uniform',
          title: 'Overdue Bill',
          amount: '75.00',
          due_date: '2024-02-28',
          status: 'overdue'
        }
      ])
      .execute();

    const bills = await getBillsByStudent(studentResult[0].id);

    expect(bills).toHaveLength(3);
    
    const statuses = bills.map(bill => bill.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('paid');
    expect(statuses).toContain('overdue');

    // Verify all bills have proper data types
    bills.forEach(bill => {
      expect(typeof bill.amount).toBe('number');
      expect(bill.due_date).toBeInstanceOf(Date);
      expect(bill.student_id).toEqual(studentResult[0].id);
    });
  });
});
