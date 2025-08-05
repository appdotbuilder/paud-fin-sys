
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { savingsTable, studentsTable, usersTable, classesTable } from '../db/schema';
import { type CreateSavingsInput } from '../schema';
import { createSavings } from '../handlers/create_savings';
import { eq } from 'drizzle-orm';

describe('createSavings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testStudentId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Parent',
        role: 'parent'
      })
      .returning()
      .execute();

    const testClass = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01',
        parent_id: user[0].id,
        class_id: testClass[0].id,
        enrollment_date: '2024-01-01'
      })
      .returning()
      .execute();

    testStudentId = student[0].id;
  });

  it('should create a deposit transaction', async () => {
    const testInput: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'deposit',
      amount: 50.00,
      description: 'Initial deposit',
      transaction_date: new Date('2024-01-15')
    };

    const result = await createSavings(testInput);

    expect(result.student_id).toEqual(testStudentId);
    expect(result.transaction_type).toEqual('deposit');
    expect(result.amount).toEqual(50.00);
    expect(result.balance_after).toEqual(50.00);
    expect(result.description).toEqual('Initial deposit');
    expect(result.transaction_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.amount).toBe('number');
    expect(typeof result.balance_after).toBe('number');
  });

  it('should save transaction to database', async () => {
    const testInput: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'deposit',
      amount: 25.50,
      description: 'Test deposit',
      transaction_date: new Date('2024-01-20')
    };

    const result = await createSavings(testInput);

    const transactions = await db.select()
      .from(savingsTable)
      .where(eq(savingsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].student_id).toEqual(testStudentId);
    expect(transactions[0].transaction_type).toEqual('deposit');
    expect(parseFloat(transactions[0].amount)).toEqual(25.50);
    expect(parseFloat(transactions[0].balance_after)).toEqual(25.50);
    expect(transactions[0].description).toEqual('Test deposit');
  });

  it('should calculate balance correctly with multiple transactions', async () => {
    // First deposit
    const firstDeposit: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'deposit',
      amount: 100.00,
      description: 'First deposit',
      transaction_date: new Date('2024-01-10')
    };

    const firstResult = await createSavings(firstDeposit);
    expect(firstResult.balance_after).toEqual(100.00);

    // Second deposit
    const secondDeposit: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'deposit',
      amount: 50.00,
      description: 'Second deposit',
      transaction_date: new Date('2024-01-15')
    };

    const secondResult = await createSavings(secondDeposit);
    expect(secondResult.balance_after).toEqual(150.00);

    // Withdrawal
    const withdrawal: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'withdrawal',
      amount: 30.00,
      description: 'First withdrawal',
      transaction_date: new Date('2024-01-20')
    };

    const withdrawalResult = await createSavings(withdrawal);
    expect(withdrawalResult.balance_after).toEqual(120.00);
  });

  it('should handle withdrawal with sufficient funds', async () => {
    // First create a deposit
    await createSavings({
      student_id: testStudentId,
      transaction_type: 'deposit',
      amount: 100.00,
      description: 'Initial deposit',
      transaction_date: new Date('2024-01-10')
    });

    // Then make a withdrawal
    const withdrawalInput: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'withdrawal',
      amount: 30.00,
      description: 'Test withdrawal',
      transaction_date: new Date('2024-01-15')
    };

    const result = await createSavings(withdrawalInput);

    expect(result.transaction_type).toEqual('withdrawal');
    expect(result.amount).toEqual(30.00);
    expect(result.balance_after).toEqual(70.00);
  });

  it('should reject withdrawal with insufficient funds', async () => {
    const withdrawalInput: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'withdrawal',
      amount: 50.00,
      description: 'Test withdrawal',
      transaction_date: new Date('2024-01-15')
    };

    await expect(createSavings(withdrawalInput)).rejects.toThrow(/insufficient funds/i);
  });

  it('should reject transaction for non-existent student', async () => {
    const testInput: CreateSavingsInput = {
      student_id: 99999,
      transaction_type: 'deposit',
      amount: 50.00,
      description: 'Test deposit',
      transaction_date: new Date('2024-01-15')
    };

    await expect(createSavings(testInput)).rejects.toThrow(/student.*not found/i);
  });

  it('should handle transactions without description', async () => {
    const testInput: CreateSavingsInput = {
      student_id: testStudentId,
      transaction_type: 'deposit',
      amount: 25.00,
      transaction_date: new Date('2024-01-15')
    };

    const result = await createSavings(testInput);

    expect(result.description).toBeNull();
    expect(result.amount).toEqual(25.00);
    expect(result.balance_after).toEqual(25.00);
  });
});
