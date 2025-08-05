
import { db } from '../db';
import { paymentsTable, otherIncomesTable, expensesTable, savingsTable, billsTable, studentsTable } from '../db/schema';
import { type FinancialReportFilters } from '../schema';
import { and, gte, lte, eq, sum, SQL } from 'drizzle-orm';

export interface FinancialReportData {
    total_income: number;
    total_expenses: number;
    net_income: number;
    student_payments: number;
    other_income: number;
    savings_deposits: number;
    period_start: Date;
    period_end: Date;
}

export async function generateFinancialReport(filters: FinancialReportFilters): Promise<FinancialReportData> {
    try {
        // Set default date range if not provided
        const period_start = filters.start_date || new Date(new Date().getFullYear(), 0, 1); // Start of current year
        const period_end = filters.end_date || new Date(); // Today

        // Get student payments
        const paymentConditions: SQL<unknown>[] = [
            gte(paymentsTable.payment_date, period_start),
            lte(paymentsTable.payment_date, period_end)
        ];
        
        if (filters.payment_status) {
            paymentConditions.push(eq(paymentsTable.status, filters.payment_status));
        }

        let student_payments = 0;

        if (filters.student_id || filters.class_id || filters.bill_type) {
            // Need to join with bills table for filtering
            let joinQuery = db.select({
                total: sum(paymentsTable.amount)
            }).from(paymentsTable)
            .innerJoin(billsTable, eq(paymentsTable.bill_id, billsTable.id));

            if (filters.student_id) {
                paymentConditions.push(eq(billsTable.student_id, filters.student_id));
            }

            if (filters.bill_type) {
                paymentConditions.push(eq(billsTable.bill_type, filters.bill_type));
            }

            if (filters.class_id) {
                joinQuery = joinQuery.innerJoin(studentsTable, eq(billsTable.student_id, studentsTable.id));
                paymentConditions.push(eq(studentsTable.class_id, filters.class_id));
            }

            const finalQuery = joinQuery.where(and(...paymentConditions));
            const [paymentResult] = await finalQuery.execute();
            student_payments = parseFloat(paymentResult.total || '0');
        } else {
            // Simple query without joins
            const paymentQuery = db.select({
                total: sum(paymentsTable.amount)
            }).from(paymentsTable)
            .where(and(...paymentConditions));

            const [paymentResult] = await paymentQuery.execute();
            student_payments = parseFloat(paymentResult.total || '0');
        }

        // Get other income - date columns need string format for date comparisons
        const otherIncomeConditions: SQL<unknown>[] = [
            gte(otherIncomesTable.income_date, period_start.toISOString().split('T')[0]),
            lte(otherIncomesTable.income_date, period_end.toISOString().split('T')[0])
        ];

        const otherIncomeQuery = db.select({
            total: sum(otherIncomesTable.amount)
        }).from(otherIncomesTable)
        .where(and(...otherIncomeConditions));

        const [otherIncomeResult] = await otherIncomeQuery.execute();
        const other_income = parseFloat(otherIncomeResult.total || '0');

        // Get savings deposits - timestamps need Date objects
        const savingsConditions: SQL<unknown>[] = [
            gte(savingsTable.transaction_date, period_start),
            lte(savingsTable.transaction_date, period_end),
            eq(savingsTable.transaction_type, 'deposit')
        ];

        if (filters.student_id) {
            savingsConditions.push(eq(savingsTable.student_id, filters.student_id));
        }

        let savings_deposits = 0;
        if (filters.class_id) {
            const savingsWithClassQuery = db.select({
                total: sum(savingsTable.amount)
            }).from(savingsTable)
            .innerJoin(studentsTable, eq(savingsTable.student_id, studentsTable.id))
            .where(and(...savingsConditions, eq(studentsTable.class_id, filters.class_id)));

            const [savingsResult] = await savingsWithClassQuery.execute();
            savings_deposits = parseFloat(savingsResult.total || '0');
        } else {
            const savingsQuery = db.select({
                total: sum(savingsTable.amount)
            }).from(savingsTable)
            .where(and(...savingsConditions));

            const [savingsResult] = await savingsQuery.execute();
            savings_deposits = parseFloat(savingsResult.total || '0');
        }

        // Get total expenses - date columns need string format for date comparisons
        const expenseConditions: SQL<unknown>[] = [
            gte(expensesTable.expense_date, period_start.toISOString().split('T')[0]),
            lte(expensesTable.expense_date, period_end.toISOString().split('T')[0])
        ];

        const expenseQuery = db.select({
            total: sum(expensesTable.amount)
        }).from(expensesTable)
        .where(and(...expenseConditions));

        const [expenseResult] = await expenseQuery.execute();
        const total_expenses = parseFloat(expenseResult.total || '0');

        // Calculate totals
        const total_income = student_payments + other_income;
        const net_income = total_income - total_expenses;

        return {
            total_income,
            total_expenses,
            net_income,
            student_payments,
            other_income,
            savings_deposits,
            period_start,
            period_end
        };
    } catch (error) {
        console.error('Financial report generation failed:', error);
        throw error;
    }
}
