
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, billsTable } from '../db/schema';
import { getActiveBillsByParent } from '../handlers/get_active_bills_by_parent';

describe('getActiveBillsByParent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active bills for parent\'s children', async () => {
    // Create parent user
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    // Create class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: parent.id,
        class_id: testClass.id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    // Create bills with different statuses
    await db.insert(billsTable)
      .values([
        {
          student_id: student.id,
          bill_type: 'monthly_fee',
          title: 'Pending Bill',
          amount: '150.00',
          due_date: '2024-12-31',
          status: 'pending'
        },
        {
          student_id: student.id,
          bill_type: 'book',
          title: 'Overdue Bill',
          amount: '75.50',
          due_date: '2024-11-30',
          status: 'overdue'
        },
        {
          student_id: student.id,
          bill_type: 'uniform',
          title: 'Paid Bill',
          amount: '200.00',
          due_date: '2024-10-31',
          status: 'paid'
        },
        {
          student_id: student.id,
          bill_type: 'activity',
          title: 'Cancelled Bill',
          amount: '50.00',
          due_date: '2024-09-30',
          status: 'cancelled'
        }
      ])
      .execute();

    const result = await getActiveBillsByParent(parent.id);

    // Should only return pending and overdue bills (not paid or cancelled)
    expect(result).toHaveLength(2);
    
    // Check that all returned bills are active (not paid or cancelled)
    const statuses = result.map(bill => bill.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('overdue');
    expect(statuses).not.toContain('paid');
    expect(statuses).not.toContain('cancelled');

    // Check numeric conversion
    result.forEach(bill => {
      expect(typeof bill.amount).toBe('number');
    });

    // Check specific bill details
    const pendingBill = result.find(bill => bill.status === 'pending');
    expect(pendingBill?.title).toBe('Pending Bill');
    expect(pendingBill?.amount).toBe(150.00);

    const overdueBill = result.find(bill => bill.status === 'overdue');
    expect(overdueBill?.title).toBe('Overdue Bill');
    expect(overdueBill?.amount).toBe(75.50);
  });

  it('should return bills for multiple children of the same parent', async () => {
    // Create parent user
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    // Create class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    // Create two students for the same parent
    const students = await db.insert(studentsTable)
      .values([
        {
          student_id: 'STU001',
          full_name: 'First Child',
          date_of_birth: '2010-01-01',
          parent_id: parent.id,
          class_id: testClass.id,
          enrollment_date: '2024-01-01'
        },
        {
          student_id: 'STU002',
          full_name: 'Second Child',
          date_of_birth: '2012-01-01',
          parent_id: parent.id,
          class_id: testClass.id,
          enrollment_date: '2024-01-01'
        }
      ])
      .returning()
      .execute();

    // Create bills for both students
    await db.insert(billsTable)
      .values([
        {
          student_id: students[0].id,
          bill_type: 'monthly_fee',
          title: 'First Child Bill',
          amount: '100.00',
          due_date: '2024-12-31',
          status: 'pending'
        },
        {
          student_id: students[1].id,
          bill_type: 'book',
          title: 'Second Child Bill',
          amount: '50.00',
          due_date: '2024-12-31',
          status: 'overdue'
        }
      ])
      .execute();

    const result = await getActiveBillsByParent(parent.id);

    expect(result).toHaveLength(2);
    expect(result.map(bill => bill.title)).toContain('First Child Bill');
    expect(result.map(bill => bill.title)).toContain('Second Child Bill');
  });

  it('should return empty array when parent has no children', async () => {
    // Create parent user with no children
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    const result = await getActiveBillsByParent(parent.id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when parent\'s children have no active bills', async () => {
    // Create parent user
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    // Create class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: parent.id,
        class_id: testClass.id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    // Create only paid and cancelled bills
    await db.insert(billsTable)
      .values([
        {
          student_id: student.id,
          bill_type: 'monthly_fee',
          title: 'Paid Bill',
          amount: '100.00',
          due_date: '2024-12-31',
          status: 'paid'
        },
        {
          student_id: student.id,
          bill_type: 'book',
          title: 'Cancelled Bill',
          amount: '50.00',
          due_date: '2024-11-30',
          status: 'cancelled'
        }
      ])
      .execute();

    const result = await getActiveBillsByParent(parent.id);

    expect(result).toHaveLength(0);
  });

  it('should not return bills for other parents\' children', async () => {
    // Create two different parents
    const parents = await db.insert(usersTable)
      .values([
        {
          email: 'parent1@test.com',
          password_hash: 'hashed_password',
          full_name: 'Parent One',
          role: 'parent'
        },
        {
          email: 'parent2@test.com',
          password_hash: 'hashed_password',
          full_name: 'Parent Two',
          role: 'parent'
        }
      ])
      .returning()
      .execute();

    // Create class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    // Create students for each parent
    const students = await db.insert(studentsTable)
      .values([
        {
          student_id: 'STU001',
          full_name: 'Child of Parent One',
          date_of_birth: '2010-01-01',
          parent_id: parents[0].id,
          class_id: testClass.id,
          enrollment_date: '2024-01-01'
        },
        {
          student_id: 'STU002',
          full_name: 'Child of Parent Two',
          date_of_birth: '2012-01-01',
          parent_id: parents[1].id,
          class_id: testClass.id,
          enrollment_date: '2024-01-01'
        }
      ])
      .returning()
      .execute();

    // Create bills for both students
    await db.insert(billsTable)
      .values([
        {
          student_id: students[0].id,
          bill_type: 'monthly_fee',
          title: 'Parent One Child Bill',
          amount: '100.00',
          due_date: '2024-12-31',
          status: 'pending'
        },
        {
          student_id: students[1].id,
          bill_type: 'book',
          title: 'Parent Two Child Bill',
          amount: '50.00',
          due_date: '2024-12-31',
          status: 'pending'
        }
      ])
      .execute();

    // Query bills for parent one only
    const result = await getActiveBillsByParent(parents[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Parent One Child Bill');
    expect(result[0].student_id).toBe(students[0].id);
  });
});
