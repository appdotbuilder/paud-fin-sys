
import { serial, text, pgTable, timestamp, numeric, integer, boolean, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'parent']);
export const billTypeEnum = pgEnum('bill_type', ['monthly_fee', 'registration', 'activity', 'uniform', 'book', 'other']);
export const billStatusEnum = pgEnum('bill_status', ['pending', 'paid', 'overdue', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'credit_card', 'digital_wallet']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);
export const savingsTransactionTypeEnum = pgEnum('savings_transaction_type', ['deposit', 'withdrawal']);
export const incomeCategoryEnum = pgEnum('income_category', ['donation', 'fundraising', 'government_aid', 'investment', 'other']);
export const expenseCategoryEnum = pgEnum('expense_category', ['salary', 'utilities', 'supplies', 'maintenance', 'food', 'transportation', 'marketing', 'training', 'other']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  monthly_fee: numeric('monthly_fee', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  student_id: text('student_id').notNull().unique(),
  full_name: text('full_name').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  parent_id: integer('parent_id').notNull(),
  class_id: integer('class_id').notNull(),
  enrollment_date: date('enrollment_date').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Bills table
export const billsTable = pgTable('bills', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull(),
  bill_type: billTypeEnum('bill_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  due_date: date('due_date').notNull(),
  status: billStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  bill_id: integer('bill_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  payment_date: timestamp('payment_date').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  reference_number: text('reference_number'),
  notes: text('notes'),
  receipt_url: text('receipt_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Savings table
export const savingsTable = pgTable('savings', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull(),
  transaction_type: savingsTransactionTypeEnum('transaction_type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  balance_after: numeric('balance_after', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  transaction_date: timestamp('transaction_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Other incomes table
export const otherIncomesTable = pgTable('other_incomes', {
  id: serial('id').primaryKey(),
  category: incomeCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  income_date: date('income_date').notNull(),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Expenses table
export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  category: expenseCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  expense_date: date('expense_date').notNull(),
  receipt_url: text('receipt_url'),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  children: many(studentsTable),
  created_incomes: many(otherIncomesTable),
  created_expenses: many(expensesTable)
}));

export const classesRelations = relations(classesTable, ({ many }) => ({
  students: many(studentsTable)
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  parent: one(usersTable, {
    fields: [studentsTable.parent_id],
    references: [usersTable.id]
  }),
  class: one(classesTable, {
    fields: [studentsTable.class_id],
    references: [classesTable.id]
  }),
  bills: many(billsTable),
  savings: many(savingsTable)
}));

export const billsRelations = relations(billsTable, ({ one, many }) => ({
  student: one(studentsTable, {
    fields: [billsTable.student_id],
    references: [studentsTable.id]
  }),
  payments: many(paymentsTable)
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  bill: one(billsTable, {
    fields: [paymentsTable.bill_id],
    references: [billsTable.id]
  })
}));

export const savingsRelations = relations(savingsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [savingsTable.student_id],
    references: [studentsTable.id]
  })
}));

export const otherIncomesRelations = relations(otherIncomesTable, ({ one }) => ({
  created_by_user: one(usersTable, {
    fields: [otherIncomesTable.created_by],
    references: [usersTable.id]
  })
}));

export const expensesRelations = relations(expensesTable, ({ one }) => ({
  created_by_user: one(usersTable, {
    fields: [expensesTable.created_by],
    references: [usersTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  classes: classesTable,
  students: studentsTable,
  bills: billsTable,
  payments: paymentsTable,
  savings: savingsTable,
  other_incomes: otherIncomesTable,
  expenses: expensesTable
};
