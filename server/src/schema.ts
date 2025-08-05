
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['admin', 'parent']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  monthly_fee: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  student_id: z.string(),
  full_name: z.string(),
  date_of_birth: z.coerce.date(),
  parent_id: z.number(),
  class_id: z.number(),
  enrollment_date: z.coerce.date(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Bill type enum
export const billTypeSchema = z.enum(['monthly_fee', 'registration', 'activity', 'uniform', 'book', 'other']);
export type BillType = z.infer<typeof billTypeSchema>;

// Bill status enum
export const billStatusSchema = z.enum(['pending', 'paid', 'overdue', 'cancelled']);
export type BillStatus = z.infer<typeof billStatusSchema>;

// Bill schema
export const billSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  bill_type: billTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  due_date: z.coerce.date(),
  status: billStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Bill = z.infer<typeof billSchema>;

// Payment method enum
export const paymentMethodSchema = z.enum(['cash', 'bank_transfer', 'credit_card', 'digital_wallet']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// Payment status enum
export const paymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// Payment schema
export const paymentSchema = z.object({
  id: z.number(),
  bill_id: z.number(),
  amount: z.number(),
  payment_method: paymentMethodSchema,
  payment_date: z.coerce.date(),
  status: paymentStatusSchema,
  reference_number: z.string().nullable(),
  notes: z.string().nullable(),
  receipt_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Payment = z.infer<typeof paymentSchema>;

// Savings transaction type enum
export const savingsTransactionTypeSchema = z.enum(['deposit', 'withdrawal']);
export type SavingsTransactionType = z.infer<typeof savingsTransactionTypeSchema>;

// Savings schema
export const savingsSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  transaction_type: savingsTransactionTypeSchema,
  amount: z.number(),
  balance_after: z.number(),
  description: z.string().nullable(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Savings = z.infer<typeof savingsSchema>;

// Other income category enum
export const incomeCategorySchema = z.enum(['donation', 'fundraising', 'government_aid', 'investment', 'other']);
export type IncomeCategory = z.infer<typeof incomeCategorySchema>;

// Other income schema
export const otherIncomeSchema = z.object({
  id: z.number(),
  category: incomeCategorySchema,
  title: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  income_date: z.coerce.date(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type OtherIncome = z.infer<typeof otherIncomeSchema>;

// Expense category enum
export const expenseCategorySchema = z.enum(['salary', 'utilities', 'supplies', 'maintenance', 'food', 'transportation', 'marketing', 'training', 'other']);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

// Expense schema
export const expenseSchema = z.object({
  id: z.number(),
  category: expenseCategorySchema,
  title: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  expense_date: z.coerce.date(),
  receipt_url: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string(),
  role: userRoleSchema,
  is_active: z.boolean().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createClassInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  monthly_fee: z.number().positive(),
  is_active: z.boolean().optional()
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const createStudentInputSchema = z.object({
  student_id: z.string(),
  full_name: z.string(),
  date_of_birth: z.coerce.date(),
  parent_id: z.number(),
  class_id: z.number(),
  enrollment_date: z.coerce.date(),
  is_active: z.boolean().optional()
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const createBillInputSchema = z.object({
  student_id: z.number(),
  bill_type: billTypeSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  amount: z.number().positive(),
  due_date: z.coerce.date()
});

export type CreateBillInput = z.infer<typeof createBillInputSchema>;

export const createPaymentInputSchema = z.object({
  bill_id: z.number(),
  amount: z.number().positive(),
  payment_method: paymentMethodSchema,
  payment_date: z.coerce.date(),
  reference_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

export const createSavingsInputSchema = z.object({
  student_id: z.number(),
  transaction_type: savingsTransactionTypeSchema,
  amount: z.number().positive(),
  description: z.string().nullable().optional(),
  transaction_date: z.coerce.date()
});

export type CreateSavingsInput = z.infer<typeof createSavingsInputSchema>;

export const createOtherIncomeInputSchema = z.object({
  category: incomeCategorySchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  amount: z.number().positive(),
  income_date: z.coerce.date(),
  created_by: z.number()
});

export type CreateOtherIncomeInput = z.infer<typeof createOtherIncomeInputSchema>;

export const createExpenseInputSchema = z.object({
  category: expenseCategorySchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  amount: z.number().positive(),
  expense_date: z.coerce.date(),
  receipt_url: z.string().nullable().optional(),
  created_by: z.number()
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// Authentication schemas
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Filter schemas for reports
export const financialReportFiltersSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  student_id: z.number().optional(),
  class_id: z.number().optional(),
  payment_status: paymentStatusSchema.optional(),
  bill_type: billTypeSchema.optional()
});

export type FinancialReportFilters = z.infer<typeof financialReportFiltersSchema>;

export const exportFormatSchema = z.enum(['pdf', 'excel']);
export type ExportFormat = z.infer<typeof exportFormatSchema>;
