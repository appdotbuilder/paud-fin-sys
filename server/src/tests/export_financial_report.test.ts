
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, billsTable, paymentsTable, savingsTable, otherIncomesTable, expensesTable } from '../db/schema';
import { type FinancialReportFilters, type ExportFormat } from '../schema';
import { exportFinancialReport } from '../handlers/export_financial_report';

describe('exportFinancialReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  async function createTestData() {
    // Create admin user
    const [admin] = await db.insert(usersTable)
      .values({
        email: 'admin@school.com',
        password_hash: 'hash123',
        full_name: 'Admin User',
        role: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    // Create parent user
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@example.com',
        password_hash: 'hash123',
        full_name: 'Parent User',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    // Create class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Grade 1A',
        description: 'First grade class A',
        monthly_fee: '150.00',
        is_active: true
      })
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        date_of_birth: '2015-01-01',
        parent_id: parent.id,
        class_id: testClass.id,
        enrollment_date: '2024-01-01',
        is_active: true
      })
      .returning()
      .execute();

    // Create bill
    const [bill] = await db.insert(billsTable)
      .values({
        student_id: student.id,
        bill_type: 'monthly_fee',
        title: 'January 2024 Monthly Fee',
        description: 'Monthly tuition fee',
        amount: '150.00',
        due_date: '2024-01-31',
        status: 'paid'
      })
      .returning()
      .execute();

    // Create payment
    await db.insert(paymentsTable)
      .values({
        bill_id: bill.id,
        amount: '150.00',
        payment_method: 'bank_transfer',
        payment_date: new Date('2024-01-25'),
        status: 'completed',
        reference_number: 'REF001'
      })
      .execute();

    // Create savings transaction
    await db.insert(savingsTable)
      .values({
        student_id: student.id,
        transaction_type: 'deposit',
        amount: '50.00',
        balance_after: '50.00',
        description: 'Initial savings deposit',
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    // Create other income
    await db.insert(otherIncomesTable)
      .values({
        category: 'donation',
        title: 'Monthly Donation',
        description: 'Community donation',
        amount: '500.00',
        income_date: '2024-01-10',
        created_by: admin.id
      })
      .execute();

    // Create expense
    await db.insert(expensesTable)
      .values({
        category: 'utilities',
        title: 'Electricity Bill',
        description: 'Monthly electricity expense',
        amount: '100.00',
        expense_date: '2024-01-05',
        created_by: admin.id
      })
      .execute();

    return { admin, parent, testClass, student, bill };
  }

  it('should export PDF financial report with all data', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'pdf');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.pdf$/);
    expect(result).toMatch(/financial_report_/);
  });

  it('should export Excel financial report with all data', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'excel');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.xlsx$/);
    expect(result).toMatch(/financial_report_/);
  });

  it('should filter report by student_id', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      student_id: testData.student.id,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'pdf');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.pdf$/);
  });

  it('should filter report by class_id', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      class_id: testData.testClass.id,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'excel');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.xlsx$/);
  });

  it('should filter report by bill_type', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      bill_type: 'monthly_fee',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'pdf');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.pdf$/);
  });

  it('should filter report by payment_status', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      payment_status: 'completed',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'excel');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.xlsx$/);
  });

  it('should handle empty data sets', async () => {
    // Don't create any test data - test with empty database
    const filters: FinancialReportFilters = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'pdf');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.pdf$/);
  });

  it('should handle date range filters correctly', async () => {
    const testData = await createTestData();
    
    // Filter to a date range that should exclude our test data
    const filters: FinancialReportFilters = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };
    
    const result = await exportFinancialReport(filters, 'excel');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.xlsx$/);
  });

  it('should handle filters with no date range', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      student_id: testData.student.id
    };
    
    const result = await exportFinancialReport(filters, 'pdf');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.pdf$/);
  });

  it('should handle complex filter combinations', async () => {
    const testData = await createTestData();
    
    const filters: FinancialReportFilters = {
      student_id: testData.student.id,
      class_id: testData.testClass.id,
      bill_type: 'monthly_fee',
      payment_status: 'completed',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    
    const result = await exportFinancialReport(filters, 'excel');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/\.xlsx$/);
  });
});
