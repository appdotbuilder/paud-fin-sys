
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, billsTable, paymentsTable, otherIncomesTable, expensesTable, savingsTable } from '../db/schema';
import { type FinancialReportFilters } from '../schema';
import { generateFinancialReport } from '../handlers/generate_financial_report';

describe('generateFinancialReport', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should generate basic financial report without filters', async () => {
        // Create test data
        const [admin] = await db.insert(usersTable).values({
            email: 'admin@test.com',
            password_hash: 'hash',
            full_name: 'Admin User',
            role: 'admin'
        }).returning().execute();

        const [parent] = await db.insert(usersTable).values({
            email: 'parent@test.com',
            password_hash: 'hash',
            full_name: 'Parent User',
            role: 'parent'
        }).returning().execute();

        const [testClass] = await db.insert(classesTable).values({
            name: 'Test Class',
            monthly_fee: '100.00'
        }).returning().execute();

        const [student] = await db.insert(studentsTable).values({
            student_id: 'STU001',
            full_name: 'Test Student',
            date_of_birth: '2010-01-01',
            parent_id: parent.id,
            class_id: testClass.id,
            enrollment_date: '2024-01-01'
        }).returning().execute();

        const [bill] = await db.insert(billsTable).values({
            student_id: student.id,
            bill_type: 'monthly_fee',
            title: 'Monthly Fee',
            amount: '100.00',
            due_date: '2024-12-31',
            status: 'paid'
        }).returning().execute();

        await db.insert(paymentsTable).values({
            bill_id: bill.id,
            amount: '100.00',
            payment_method: 'cash',
            payment_date: new Date(),
            status: 'completed'
        }).execute();

        // Use current year dates to match the default filter range
        const currentYear = new Date().getFullYear();
        const currentDate = new Date().toISOString().split('T')[0];

        await db.insert(otherIncomesTable).values({
            category: 'donation',
            title: 'Test Donation',
            amount: '50.00',
            income_date: currentDate,
            created_by: admin.id
        }).execute();

        await db.insert(expensesTable).values({
            category: 'supplies',
            title: 'Test Expense',
            amount: '30.00',
            expense_date: currentDate,
            created_by: admin.id
        }).execute();

        await db.insert(savingsTable).values({
            student_id: student.id,
            transaction_type: 'deposit',
            amount: '20.00',
            balance_after: '20.00',
            transaction_date: new Date()
        }).execute();

        const filters: FinancialReportFilters = {};
        const result = await generateFinancialReport(filters);

        expect(result.student_payments).toEqual(100);
        expect(result.other_income).toEqual(50);
        expect(result.total_income).toEqual(150);
        expect(result.total_expenses).toEqual(30);
        expect(result.net_income).toEqual(120);
        expect(result.savings_deposits).toEqual(20);
        expect(result.period_start).toBeInstanceOf(Date);
        expect(result.period_end).toBeInstanceOf(Date);
    });

    it('should filter by date range', async () => {
        // Create test data with different dates
        const [admin] = await db.insert(usersTable).values({
            email: 'admin@test.com',
            password_hash: 'hash',
            full_name: 'Admin User',
            role: 'admin'
        }).returning().execute();

        const [parent] = await db.insert(usersTable).values({
            email: 'parent@test.com',
            password_hash: 'hash',
            full_name: 'Parent User',
            role: 'parent'
        }).returning().execute();

        const [testClass] = await db.insert(classesTable).values({
            name: 'Test Class',
            monthly_fee: '100.00'
        }).returning().execute();

        const [student] = await db.insert(studentsTable).values({
            student_id: 'STU001',
            full_name: 'Test Student',
            date_of_birth: '2010-01-01',
            parent_id: parent.id,
            class_id: testClass.id,
            enrollment_date: '2024-01-01'
        }).returning().execute();

        const [bill] = await db.insert(billsTable).values({
            student_id: student.id,
            bill_type: 'monthly_fee',
            title: 'Monthly Fee',
            amount: '100.00',
            due_date: '2024-12-31',
            status: 'paid'
        }).returning().execute();

        // Payment within range
        const targetDate = new Date('2024-06-15');
        await db.insert(paymentsTable).values({
            bill_id: bill.id,
            amount: '100.00',
            payment_method: 'cash',
            payment_date: targetDate,
            status: 'completed'
        }).execute();

        // Payment outside range
        await db.insert(paymentsTable).values({
            bill_id: bill.id,
            amount: '50.00',
            payment_method: 'cash',
            payment_date: new Date('2024-01-01'),
            status: 'completed'
        }).execute();

        const start_date = new Date('2024-06-01');
        const end_date = new Date('2024-06-30');
        const filters: FinancialReportFilters = {
            start_date,
            end_date
        };

        const result = await generateFinancialReport(filters);

        expect(result.student_payments).toEqual(100);
        expect(result.period_start).toEqual(start_date);
        expect(result.period_end).toEqual(end_date);
    });

    it('should filter by student_id', async () => {
        // Create multiple students and payments
        const [admin] = await db.insert(usersTable).values({
            email: 'admin@test.com',
            password_hash: 'hash',
            full_name: 'Admin User',
            role: 'admin'
        }).returning().execute();

        const [parent] = await db.insert(usersTable).values({
            email: 'parent@test.com',
            password_hash: 'hash',
            full_name: 'Parent User',
            role: 'parent'
        }).returning().execute();

        const [testClass] = await db.insert(classesTable).values({
            name: 'Test Class',
            monthly_fee: '100.00'
        }).returning().execute();

        const [student1] = await db.insert(studentsTable).values({
            student_id: 'STU001',
            full_name: 'Test Student 1',
            date_of_birth: '2010-01-01',
            parent_id: parent.id,
            class_id: testClass.id,
            enrollment_date: '2024-01-01'
        }).returning().execute();

        const [student2] = await db.insert(studentsTable).values({
            student_id: 'STU002',
            full_name: 'Test Student 2',
            date_of_birth: '2010-01-01',
            parent_id: parent.id,
            class_id: testClass.id,
            enrollment_date: '2024-01-01'
        }).returning().execute();

        const [bill1] = await db.insert(billsTable).values({
            student_id: student1.id,
            bill_type: 'monthly_fee',
            title: 'Monthly Fee 1',
            amount: '100.00',
            due_date: '2024-12-31',
            status: 'paid'
        }).returning().execute();

        const [bill2] = await db.insert(billsTable).values({
            student_id: student2.id,
            bill_type: 'monthly_fee',
            title: 'Monthly Fee 2',
            amount: '75.00',
            due_date: '2024-12-31',
            status: 'paid'
        }).returning().execute();

        await db.insert(paymentsTable).values({
            bill_id: bill1.id,
            amount: '100.00',
            payment_method: 'cash',
            payment_date: new Date(),
            status: 'completed'
        }).execute();

        await db.insert(paymentsTable).values({
            bill_id: bill2.id,
            amount: '75.00',
            payment_method: 'cash',
            payment_date: new Date(),
            status: 'completed'
        }).execute();

        const filters: FinancialReportFilters = {
            student_id: student1.id
        };

        const result = await generateFinancialReport(filters);

        expect(result.student_payments).toEqual(100);
        expect(result.total_income).toEqual(100);
    });

    it('should filter by payment status', async () => {
        // Create test data with different payment statuses
        const [parent] = await db.insert(usersTable).values({
            email: 'parent@test.com',
            password_hash: 'hash',
            full_name: 'Parent User',
            role: 'parent'
        }).returning().execute();

        const [testClass] = await db.insert(classesTable).values({
            name: 'Test Class',
            monthly_fee: '100.00'
        }).returning().execute();

        const [student] = await db.insert(studentsTable).values({
            student_id: 'STU001',
            full_name: 'Test Student',
            date_of_birth: '2010-01-01',
            parent_id: parent.id,
            class_id: testClass.id,
            enrollment_date: '2024-01-01'
        }).returning().execute();

        const [bill] = await db.insert(billsTable).values({
            student_id: student.id,
            bill_type: 'monthly_fee',
            title: 'Monthly Fee',
            amount: '100.00',
            due_date: '2024-12-31',
            status: 'paid'
        }).returning().execute();

        // Completed payment
        await db.insert(paymentsTable).values({
            bill_id: bill.id,
            amount: '100.00',
            payment_method: 'cash',
            payment_date: new Date(),
            status: 'completed'
        }).execute();

        // Pending payment
        await db.insert(paymentsTable).values({
            bill_id: bill.id,
            amount: '50.00',
            payment_method: 'cash',
            payment_date: new Date(),
            status: 'pending'
        }).execute();

        const filters: FinancialReportFilters = {
            payment_status: 'completed'
        };

        const result = await generateFinancialReport(filters);

        expect(result.student_payments).toEqual(100);
    });

    it('should handle empty results', async () => {
        const filters: FinancialReportFilters = {};
        const result = await generateFinancialReport(filters);

        expect(result.student_payments).toEqual(0);
        expect(result.other_income).toEqual(0);
        expect(result.total_income).toEqual(0);
        expect(result.total_expenses).toEqual(0);
        expect(result.net_income).toEqual(0);
        expect(result.savings_deposits).toEqual(0);
        expect(result.period_start).toBeInstanceOf(Date);
        expect(result.period_end).toBeInstanceOf(Date);
    });
});
