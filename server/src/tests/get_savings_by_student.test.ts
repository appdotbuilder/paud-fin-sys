
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, savingsTable } from '../db/schema';
import { getSavingsByStudent } from '../handlers/get_savings_by_student';
import { eq } from 'drizzle-orm';

describe('getSavingsByStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for student with no savings', async () => {
    // Create prerequisite data
    const parent = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Parent User',
        role: 'parent'
      })
      .returning()
      .execute();

    const classRecord = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: parent[0].id,
        class_id: classRecord[0].id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    const result = await getSavingsByStudent(student[0].id);

    expect(result).toEqual([]);
  });

  it('should return savings transactions for a student', async () => {
    // Create prerequisite data
    const parent = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Parent User',
        role: 'parent'
      })
      .returning()
      .execute();

    const classRecord = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: parent[0].id,
        class_id: classRecord[0].id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    // Create savings transactions
    const transaction1 = await db.insert(savingsTable)
      .values({
        student_id: student[0].id,
        transaction_type: 'deposit',
        amount: '50.00',
        balance_after: '50.00',
        description: 'First deposit',
        transaction_date: new Date('2024-01-15')
      })
      .returning()
      .execute();

    const transaction2 = await db.insert(savingsTable)
      .values({
        student_id: student[0].id,
        transaction_type: 'deposit',
        amount: '25.00',
        balance_after: '75.00',
        description: 'Second deposit',
        transaction_date: new Date('2024-01-20')
      })
      .returning()
      .execute();

    const result = await getSavingsByStudent(student[0].id);

    expect(result).toHaveLength(2);
    
    // Should be ordered by most recent first (transaction_date desc)
    expect(result[0].id).toEqual(transaction2[0].id);
    expect(result[0].amount).toEqual(25.00);
    expect(result[0].balance_after).toEqual(75.00);
    expect(result[0].transaction_type).toEqual('deposit');
    expect(result[0].description).toEqual('Second deposit');
    expect(result[0].transaction_date).toBeInstanceOf(Date);

    expect(result[1].id).toEqual(transaction1[0].id);
    expect(result[1].amount).toEqual(50.00);
    expect(result[1].balance_after).toEqual(50.00);
    expect(result[1].transaction_type).toEqual('deposit');
    expect(result[1].description).toEqual('First deposit');
    expect(result[1].transaction_date).toBeInstanceOf(Date);
  });

  it('should return only savings for the specified student', async () => {
    // Create prerequisite data for two students
    const parent = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Parent User',
        role: 'parent'
      })
      .returning()
      .execute();

    const classRecord = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    const student1 = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student 1',
        date_of_birth: '2010-01-01',
        parent_id: parent[0].id,
        class_id: classRecord[0].id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    const student2 = await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Test Student 2',
        date_of_birth: '2010-01-02',
        parent_id: parent[0].id,
        class_id: classRecord[0].id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    // Create savings for both students
    await db.insert(savingsTable)
      .values({
        student_id: student1[0].id,
        transaction_type: 'deposit',
        amount: '50.00',
        balance_after: '50.00',
        description: 'Student 1 deposit',
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    await db.insert(savingsTable)
      .values({
        student_id: student2[0].id,
        transaction_type: 'deposit',
        amount: '75.00',
        balance_after: '75.00',
        description: 'Student 2 deposit',
        transaction_date: new Date('2024-01-16')
      })
      .execute();

    const result = await getSavingsByStudent(student1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual(student1[0].id);
    expect(result[0].amount).toEqual(50.00);
    expect(result[0].description).toEqual('Student 1 deposit');
  });

  it('should handle withdrawal transactions correctly', async () => {
    // Create prerequisite data
    const parent = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Parent User',
        role: 'parent'
      })
      .returning()
      .execute();

    const classRecord = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: parent[0].id,
        class_id: classRecord[0].id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    // Create a withdrawal transaction
    await db.insert(savingsTable)
      .values({
        student_id: student[0].id,
        transaction_type: 'withdrawal',
        amount: '20.00',
        balance_after: '30.00',
        description: 'Withdrawal for books',
        transaction_date: new Date('2024-01-25')
      })
      .execute();

    const result = await getSavingsByStudent(student[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].transaction_type).toEqual('withdrawal');
    expect(result[0].amount).toEqual(20.00);
    expect(result[0].balance_after).toEqual(30.00);
    expect(result[0].description).toEqual('Withdrawal for books');
  });

  it('should verify numeric conversions are correct', async () => {
    // Create prerequisite data
    const parent = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Parent User',
        role: 'parent'
      })
      .returning()
      .execute();

    const classRecord = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: parent[0].id,
        class_id: classRecord[0].id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    await db.insert(savingsTable)
      .values({
        student_id: student[0].id,
        transaction_type: 'deposit',
        amount: '123.45',
        balance_after: '456.78',
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    const result = await getSavingsByStudent(student[0].id);

    expect(result).toHaveLength(1);
    expect(typeof result[0].amount).toBe('number');
    expect(typeof result[0].balance_after).toBe('number');
    expect(result[0].amount).toEqual(123.45);
    expect(result[0].balance_after).toEqual(456.78);
  });
});
