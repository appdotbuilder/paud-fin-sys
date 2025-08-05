
import { db } from '../db';
import { billsTable, paymentsTable, studentsTable, classesTable, savingsTable, otherIncomesTable, expensesTable } from '../db/schema';
import { type FinancialReportFilters, type ExportFormat } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

interface ReportData {
  bills: Array<{
    id: number;
    student_name: string;
    class_name: string;
    bill_type: string;
    title: string;
    amount: number;
    due_date: Date;
    status: string;
    created_at: Date;
  }>;
  payments: Array<{
    id: number;
    student_name: string;
    bill_title: string;
    amount: number;
    payment_method: string;
    payment_date: Date;
    status: string;
    reference_number: string | null;
  }>;
  savings: Array<{
    id: number;
    student_name: string;
    transaction_type: string;
    amount: number;
    balance_after: number;
    transaction_date: Date;
    description: string | null;
  }>;
  otherIncomes: Array<{
    id: number;
    category: string;
    title: string;
    amount: number;
    income_date: Date;
    description: string | null;
  }>;
  expenses: Array<{
    id: number;
    category: string;
    title: string;
    amount: number;
    expense_date: Date;
    description: string | null;
  }>;
  summary: {
    totalBillAmount: number;
    totalPaymentAmount: number;
    totalSavingsDeposits: number;
    totalSavingsWithdrawals: number;
    totalOtherIncome: number;
    totalExpenses: number;
    netIncome: number;
  };
}

export async function exportFinancialReport(filters: FinancialReportFilters, format: ExportFormat): Promise<string> {
  try {
    // Collect report data
    const reportData = await collectReportData(filters);
    
    // Generate report based on format
    if (format === 'pdf') {
      return generatePDFReport(reportData, filters);
    } else {
      return generateExcelReport(reportData, filters);
    }
  } catch (error) {
    console.error('Financial report export failed:', error);
    throw error;
  }
}

async function collectReportData(filters: FinancialReportFilters): Promise<ReportData> {
  // Collect bills data
  const bills = await getBillsData(filters);
  
  // Collect payments data
  const payments = await getPaymentsData(filters);
  
  // Collect savings data
  const savings = await getSavingsData(filters);
  
  // Collect other incomes data
  const otherIncomes = await getOtherIncomesData(filters);
  
  // Collect expenses data
  const expenses = await getExpensesData(filters);
  
  // Calculate summary
  const summary = calculateSummary(bills, payments, savings, otherIncomes, expenses);
  
  return {
    bills,
    payments,
    savings,
    otherIncomes,
    expenses,
    summary
  };
}

async function getBillsData(filters: FinancialReportFilters) {
  // Base query with joins
  const baseQuery = db.select({
    id: billsTable.id,
    student_name: studentsTable.full_name,
    class_name: classesTable.name,
    bill_type: billsTable.bill_type,
    title: billsTable.title,
    amount: billsTable.amount,
    due_date: billsTable.due_date,
    status: billsTable.status,
    created_at: billsTable.created_at
  })
  .from(billsTable)
  .innerJoin(studentsTable, eq(billsTable.student_id, studentsTable.id))
  .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id));
  
  const conditions: SQL<unknown>[] = [];
  
  if (filters.start_date) {
    conditions.push(gte(billsTable.created_at, filters.start_date));
  }
  
  if (filters.end_date) {
    conditions.push(lte(billsTable.created_at, filters.end_date));
  }
  
  if (filters.student_id) {
    conditions.push(eq(billsTable.student_id, filters.student_id));
  }
  
  if (filters.class_id) {
    conditions.push(eq(studentsTable.class_id, filters.class_id));
  }
  
  if (filters.bill_type) {
    conditions.push(eq(billsTable.bill_type, filters.bill_type));
  }
  
  // Execute query with or without conditions
  const results = conditions.length > 0 
    ? await baseQuery.where(and(...conditions)).execute()
    : await baseQuery.execute();
  
  return results.map(result => ({
    ...result,
    amount: parseFloat(result.amount),
    due_date: new Date(result.due_date)
  }));
}

async function getPaymentsData(filters: FinancialReportFilters) {
  // Base query with joins
  const baseQuery = db.select({
    id: paymentsTable.id,
    student_name: studentsTable.full_name,
    bill_title: billsTable.title,
    amount: paymentsTable.amount,
    payment_method: paymentsTable.payment_method,
    payment_date: paymentsTable.payment_date,
    status: paymentsTable.status,
    reference_number: paymentsTable.reference_number
  })
  .from(paymentsTable)
  .innerJoin(billsTable, eq(paymentsTable.bill_id, billsTable.id))
  .innerJoin(studentsTable, eq(billsTable.student_id, studentsTable.id))
  .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id));
  
  const conditions: SQL<unknown>[] = [];
  
  if (filters.start_date) {
    conditions.push(gte(paymentsTable.payment_date, filters.start_date));
  }
  
  if (filters.end_date) {
    conditions.push(lte(paymentsTable.payment_date, filters.end_date));
  }
  
  if (filters.student_id) {
    conditions.push(eq(billsTable.student_id, filters.student_id));
  }
  
  if (filters.class_id) {
    conditions.push(eq(studentsTable.class_id, filters.class_id));
  }
  
  if (filters.payment_status) {
    conditions.push(eq(paymentsTable.status, filters.payment_status));
  }
  
  // Execute query with or without conditions
  const results = conditions.length > 0 
    ? await baseQuery.where(and(...conditions)).execute()
    : await baseQuery.execute();
  
  return results.map(result => ({
    ...result,
    amount: parseFloat(result.amount)
  }));
}

async function getSavingsData(filters: FinancialReportFilters) {
  // Base query with joins
  const baseQuery = db.select({
    id: savingsTable.id,
    student_name: studentsTable.full_name,
    transaction_type: savingsTable.transaction_type,
    amount: savingsTable.amount,
    balance_after: savingsTable.balance_after,
    transaction_date: savingsTable.transaction_date,
    description: savingsTable.description
  })
  .from(savingsTable)
  .innerJoin(studentsTable, eq(savingsTable.student_id, studentsTable.id))
  .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id));
  
  const conditions: SQL<unknown>[] = [];
  
  if (filters.start_date) {
    conditions.push(gte(savingsTable.transaction_date, filters.start_date));
  }
  
  if (filters.end_date) {
    conditions.push(lte(savingsTable.transaction_date, filters.end_date));
  }
  
  if (filters.student_id) {
    conditions.push(eq(savingsTable.student_id, filters.student_id));
  }
  
  if (filters.class_id) {
    conditions.push(eq(studentsTable.class_id, filters.class_id));
  }
  
  // Execute query with or without conditions
  const results = conditions.length > 0 
    ? await baseQuery.where(and(...conditions)).execute()
    : await baseQuery.execute();
  
  return results.map(result => ({
    ...result,
    amount: parseFloat(result.amount),
    balance_after: parseFloat(result.balance_after)
  }));
}

async function getOtherIncomesData(filters: FinancialReportFilters) {
  // Base query
  const baseQuery = db.select({
    id: otherIncomesTable.id,
    category: otherIncomesTable.category,
    title: otherIncomesTable.title,
    amount: otherIncomesTable.amount,
    income_date: otherIncomesTable.income_date,
    description: otherIncomesTable.description
  })
  .from(otherIncomesTable);
  
  const conditions: SQL<unknown>[] = [];
  
  if (filters.start_date) {
    conditions.push(gte(otherIncomesTable.income_date, filters.start_date.toISOString().split('T')[0]));
  }
  
  if (filters.end_date) {
    conditions.push(lte(otherIncomesTable.income_date, filters.end_date.toISOString().split('T')[0]));
  }
  
  // Execute query with or without conditions
  const results = conditions.length > 0 
    ? await baseQuery.where(and(...conditions)).execute()
    : await baseQuery.execute();
  
  return results.map(result => ({
    ...result,
    amount: parseFloat(result.amount),
    income_date: new Date(result.income_date)
  }));
}

async function getExpensesData(filters: FinancialReportFilters) {
  // Base query
  const baseQuery = db.select({
    id: expensesTable.id,
    category: expensesTable.category,
    title: expensesTable.title,
    amount: expensesTable.amount,
    expense_date: expensesTable.expense_date,
    description: expensesTable.description
  })
  .from(expensesTable);
  
  const conditions: SQL<unknown>[] = [];
  
  if (filters.start_date) {
    conditions.push(gte(expensesTable.expense_date, filters.start_date.toISOString().split('T')[0]));
  }
  
  if (filters.end_date) {
    conditions.push(lte(expensesTable.expense_date, filters.end_date.toISOString().split('T')[0]));
  }
  
  // Execute query with or without conditions
  const results = conditions.length > 0 
    ? await baseQuery.where(and(...conditions)).execute()
    : await baseQuery.execute();
  
  return results.map(result => ({
    ...result,
    amount: parseFloat(result.amount),
    expense_date: new Date(result.expense_date)
  }));
}

function calculateSummary(bills: any[], payments: any[], savings: any[], otherIncomes: any[], expenses: any[]) {
  const totalBillAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaymentAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalSavingsDeposits = savings
    .filter(s => s.transaction_type === 'deposit')
    .reduce((sum, saving) => sum + saving.amount, 0);
  const totalSavingsWithdrawals = savings
    .filter(s => s.transaction_type === 'withdrawal')
    .reduce((sum, saving) => sum + saving.amount, 0);
  const totalOtherIncome = otherIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netIncome = totalPaymentAmount + totalOtherIncome - totalExpenses;
  
  return {
    totalBillAmount,
    totalPaymentAmount,
    totalSavingsDeposits,
    totalSavingsWithdrawals,
    totalOtherIncome,
    totalExpenses,
    netIncome
  };
}

function generatePDFReport(data: ReportData, filters: FinancialReportFilters): string {
  // In a real implementation, this would use a PDF library like PDFKit or Puppeteer
  // For now, we'll simulate generating a PDF and return a mock URL
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `financial_report_${timestamp}.pdf`;
  
  // Mock PDF generation - in reality this would create actual file
  return `https://storage.example.com/reports/${filename}`;
}

function generateExcelReport(data: ReportData, filters: FinancialReportFilters): string {
  // In a real implementation, this would use a library like ExcelJS
  // For now, we'll simulate generating an Excel file and return a mock URL
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `financial_report_${timestamp}.xlsx`;
  
  // Mock Excel generation - in reality this would create actual file
  return `https://storage.example.com/reports/${filename}`;
}
