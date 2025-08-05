
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  createClassInputSchema, 
  createStudentInputSchema,
  createBillInputSchema,
  createPaymentInputSchema,
  createSavingsInputSchema,
  createOtherIncomeInputSchema,
  createExpenseInputSchema,
  loginInputSchema,
  financialReportFiltersSchema,
  exportFormatSchema
} from './schema';

// Import handlers
import { loginUser } from './handlers/auth_login';
import { createUser } from './handlers/create_user';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { createStudent } from './handlers/create_student';
import { getStudentsByParent } from './handlers/get_students_by_parent';
import { getAllStudents } from './handlers/get_all_students';
import { createBill } from './handlers/create_bill';
import { getBillsByStudent } from './handlers/get_bills_by_student';
import { getActiveBillsByParent } from './handlers/get_active_bills_by_parent';
import { createPayment } from './handlers/create_payment';
import { getPaymentHistoryByParent } from './handlers/get_payment_history_by_parent';
import { createSavings } from './handlers/create_savings';
import { getSavingsByStudent } from './handlers/get_savings_by_student';
import { getStudentSavingsBalance } from './handlers/get_student_savings_balance';
import { createOtherIncome } from './handlers/create_other_income';
import { getOtherIncomes } from './handlers/get_other_incomes';
import { createExpense } from './handlers/create_expense';
import { getExpenses } from './handlers/get_expenses';
import { generateFinancialReport } from './handlers/generate_financial_report';
import { exportFinancialReport } from './handlers/export_financial_report';
import { generatePaymentReceipt } from './handlers/generate_payment_receipt';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Class management
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  getClasses: publicProcedure
    .query(() => getClasses()),

  // Student management
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),
  getStudentsByParent: publicProcedure
    .input(z.object({ parent_id: z.number() }))
    .query(({ input }) => getStudentsByParent(input.parent_id)),
  getAllStudents: publicProcedure
    .query(() => getAllStudents()),

  // Bill management
  createBill: publicProcedure
    .input(createBillInputSchema)
    .mutation(({ input }) => createBill(input)),
  getBillsByStudent: publicProcedure
    .input(z.object({ student_id: z.number() }))
    .query(({ input }) => getBillsByStudent(input.student_id)),
  getActiveBillsByParent: publicProcedure
    .input(z.object({ parent_id: z.number() }))
    .query(({ input }) => getActiveBillsByParent(input.parent_id)),

  // Payment management
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),
  getPaymentHistoryByParent: publicProcedure
    .input(z.object({ parent_id: z.number() }))
    .query(({ input }) => getPaymentHistoryByParent(input.parent_id)),
  generatePaymentReceipt: publicProcedure
    .input(z.object({ payment_id: z.number() }))
    .mutation(({ input }) => generatePaymentReceipt(input.payment_id)),

  // Savings management
  createSavings: publicProcedure
    .input(createSavingsInputSchema)
    .mutation(({ input }) => createSavings(input)),
  getSavingsByStudent: publicProcedure
    .input(z.object({ student_id: z.number() }))
    .query(({ input }) => getSavingsByStudent(input.student_id)),
  getStudentSavingsBalance: publicProcedure
    .input(z.object({ student_id: z.number() }))
    .query(({ input }) => getStudentSavingsBalance(input.student_id)),

  // Other income management
  createOtherIncome: publicProcedure
    .input(createOtherIncomeInputSchema)
    .mutation(({ input }) => createOtherIncome(input)),
  getOtherIncomes: publicProcedure
    .query(() => getOtherIncomes()),

  // Expense management
  createExpense: publicProcedure
    .input(createExpenseInputSchema)
    .mutation(({ input }) => createExpense(input)),
  getExpenses: publicProcedure
    .query(() => getExpenses()),

  // Financial reporting
  generateFinancialReport: publicProcedure
    .input(financialReportFiltersSchema)
    .query(({ input }) => generateFinancialReport(input)),
  exportFinancialReport: publicProcedure
    .input(z.object({ 
      filters: financialReportFiltersSchema, 
      format: exportFormatSchema 
    }))
    .mutation(({ input }) => exportFinancialReport(input.filters, input.format)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Financial Management System TRPC server listening at port: ${port}`);
}

start();
