
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { billsTable, usersTable, classesTable, studentsTable } from '../db/schema';
import { type CreateBillInput } from '../schema';
import { createBill } from '../handlers/create_bill';
import { eq } from 'drizzle-orm';

describe('createBill', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite data
  async function setupTestData() {
    // Create a parent user
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    // Create a class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    // Create a student
    const [student] = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2010-01-01', // Use string format for date column
        parent_id: parent.id,
        class_id: testClass.id,
        enrollment_date: new Date().toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        is_active: true
      })
      .returning()
      .execute();

    return { parent, testClass, student };
  }

  it('should create a bill for existing student', async () => {
    const { student } = await setupTestData();

    const testInput: CreateBillInput = {
      student_id: student.id,
      bill_type: 'monthly_fee',
      title: 'January 2024 Monthly Fee',
      description: 'Monthly tuition fee for January',
      amount: 150.00,
      due_date: new Date('2024-01-31')
    };

    const result = await createBill(testInput);

    // Basic field validation
    expect(result.student_id).toEqual(student.id);
    expect(result.bill_type).toEqual('monthly_fee');
    expect(result.title).toEqual('January 2024 Monthly Fee');
    expect(result.description).toEqual('Monthly tuition fee for January');
    expect(result.amount).toEqual(150.00);
    expect(typeof result.amount).toBe('number');
    expect(result.due_date).toEqual(new Date('2024-01-31'));
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save bill to database', async () => {
    const { student } = await setupTestData();

    const testInput: CreateBillInput = {
      student_id: student.id,
      bill_type: 'registration',
      title: 'Registration Fee',
      description: null,
      amount: 50.00,
      due_date: new Date('2024-02-15')
    };

    const result = await createBill(testInput);

    // Query database to verify bill was saved
    const bills = await db.select()
      .from(billsTable)
      .where(eq(billsTable.id, result.id))
      .execute();

    expect(bills).toHaveLength(1);
    expect(bills[0].student_id).toEqual(student.id);
    expect(bills[0].bill_type).toEqual('registration');
    expect(bills[0].title).toEqual('Registration Fee');
    expect(bills[0].description).toBeNull();
    expect(parseFloat(bills[0].amount)).toEqual(50.00);
    expect(bills[0].due_date).toEqual('2024-02-15'); // Date columns are returned as strings
    expect(bills[0].status).toEqual('pending');
    expect(bills[0].created_at).toBeInstanceOf(Date);
    expect(bills[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional description field', async () => {
    const { student } = await setupTestData();

    const testInput: CreateBillInput = {
      student_id: student.id,
      bill_type: 'uniform',
      title: 'School Uniform',
      amount: 75.50,
      due_date: new Date('2024-03-01')
    };

    const result = await createBill(testInput);

    expect(result.description).toBeNull();
  });

  it('should throw error for non-existent student', async () => {
    const testInput: CreateBillInput = {
      student_id: 99999, // Non-existent student ID
      bill_type: 'activity',
      title: 'Field Trip Fee',
      description: 'Annual field trip',
      amount: 25.00,
      due_date: new Date('2024-04-15')
    };

    await expect(createBill(testInput)).rejects.toThrow(/student with id 99999 not found/i);
  });

  it('should handle all bill types correctly', async () => {
    const { student } = await setupTestData();

    const billTypes = ['monthly_fee', 'registration', 'activity', 'uniform', 'book', 'other'] as const;

    for (const billType of billTypes) {
      const testInput: CreateBillInput = {
        student_id: student.id,
        bill_type: billType,
        title: `Test ${billType} Bill`,
        description: `Description for ${billType}`,
        amount: 100.00,
        due_date: new Date('2024-05-01')
      };

      const result = await createBill(testInput);
      expect(result.bill_type).toEqual(billType);
    }
  });
});
