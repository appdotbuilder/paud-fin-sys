
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, savingsTable } from '../db/schema';
import { getStudentSavingsBalance } from '../handlers/get_student_savings_balance';

describe('getStudentSavingsBalance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return 0 for student with no savings transactions', async () => {
    // Create prerequisites
    const [user] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hash123',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    const students = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: new Date('2010-01-01'),
        parent_id: user.id,
        class_id: testClass.id,
        enrollment_date: new Date('2024-01-01'),
        is_active: true
      } as any)
      .returning()
      .execute();

    const balance = await getStudentSavingsBalance(students[0].id);

    expect(balance).toEqual(0);
  });

  it('should return correct balance from single transaction', async () => {
    // Create prerequisites
    const [user] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hash123',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    const students = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: new Date('2010-01-01'),
        parent_id: user.id,
        class_id: testClass.id,
        enrollment_date: new Date('2024-01-01'),
        is_active: true
      } as any)
      .returning()
      .execute();

    // Create a savings transaction
    await db.insert(savingsTable)
      .values({
        student_id: students[0].id,
        transaction_type: 'deposit',
        amount: '50.00',
        balance_after: '50.00',
        description: 'Initial deposit',
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    const balance = await getStudentSavingsBalance(students[0].id);

    expect(balance).toEqual(50);
    expect(typeof balance).toBe('number');
  });

  it('should return balance from most recent transaction', async () => {
    // Create prerequisites
    const [user] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hash123',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    const students = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: new Date('2010-01-01'),
        parent_id: user.id,
        class_id: testClass.id,
        enrollment_date: new Date('2024-01-01'),
        is_active: true
      } as any)
      .returning()
      .execute();

    // Create multiple savings transactions
    await db.insert(savingsTable)
      .values({
        student_id: students[0].id,
        transaction_type: 'deposit',
        amount: '100.00',
        balance_after: '100.00',
        description: 'First deposit',
        transaction_date: new Date('2024-01-01')
      })
      .execute();

    await db.insert(savingsTable)
      .values({
        student_id: students[0].id,
        transaction_type: 'deposit',
        amount: '50.00',
        balance_after: '150.00',
        description: 'Second deposit',
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    await db.insert(savingsTable)
      .values({
        student_id: students[0].id,
        transaction_type: 'withdrawal',
        amount: '25.00',
        balance_after: '125.00',
        description: 'Withdrawal',
        transaction_date: new Date('2024-01-20')
      })
      .execute();

    const balance = await getStudentSavingsBalance(students[0].id);

    expect(balance).toEqual(125);
    expect(typeof balance).toBe('number');
  });

  it('should return 0 for non-existent student', async () => {
    const balance = await getStudentSavingsBalance(999);

    expect(balance).toEqual(0);
  });

  it('should handle decimal balances correctly', async () => {
    // Create prerequisites
    const [user] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hash123',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    const students = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: new Date('2010-01-01'),
        parent_id: user.id,
        class_id: testClass.id,
        enrollment_date: new Date('2024-01-01'),
        is_active: true
      } as any)
      .returning()
      .execute();

    // Create a savings transaction with decimal amount
    await db.insert(savingsTable)
      .values({
        student_id: students[0].id,
        transaction_type: 'deposit',
        amount: '75.50',
        balance_after: '75.50',
        description: 'Decimal deposit',
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    const balance = await getStudentSavingsBalance(students[0].id);

    expect(balance).toEqual(75.5);
    expect(typeof balance).toBe('number');
  });
});
