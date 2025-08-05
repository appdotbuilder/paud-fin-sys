
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { StudentManagement } from '@/components/StudentManagement';
import { BillManagement } from '@/components/BillManagement';
import { PaymentManagement } from '@/components/PaymentManagement';
import { FinancialReports } from '@/components/FinancialReports';
import { ExpenseManagement } from '@/components/ExpenseManagement';
import { IncomeManagement } from '@/components/IncomeManagement';
import { UserManagement } from '@/components/UserManagement';
import { ClassManagement } from '@/components/ClassManagement';
import type { User } from '../../../server/src/schema';

interface AdminDashboardProps {
  user: User;
}

interface DashboardStats {
  totalStudents: number;
  activeBills: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeBills: 0,
    monthlyRevenue: 0,
    pendingPayments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Since handlers are stubs, we'll simulate some data
      // In real implementation, you'd call actual tRPC endpoints
      const students = await trpc.getAllStudents.query();
      
      // Simulated stats - replace with real calculations when handlers are implemented
      setStats({
        totalStudents: students.length,
        activeBills: 0, // Would come from counting pending bills
        monthlyRevenue: 0, // Would come from this month's payments
        pendingPayments: 0 // Would come from pending payment count
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">👨‍💼 Administrator Dashboard</h2>
        <p className="text-blue-100">
          Welcome back, {user.full_name}! Manage your PAUD's financial operations, students, and generate comprehensive reports.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <span className="text-2xl">👶</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bills</CardTitle>
            <span className="text-2xl">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.activeBills}
            </div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : `Rp ${stats.monthlyRevenue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="students">👶 Students</TabsTrigger>
          <TabsTrigger value="classes">🏫 Classes</TabsTrigger>
          <TabsTrigger value="bills">📄 Bills</TabsTrigger>
          <TabsTrigger value="payments">💳 Payments</TabsTrigger>
          <TabsTrigger value="expenses">💸 Expenses</TabsTrigger>
          <TabsTrigger value="income">💰 Income</TabsTrigger>
          <TabsTrigger value="users">👥 Users</TabsTrigger>
          <TabsTrigger value="reports">📊 Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <StudentManagement />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <ClassManagement />
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <BillManagement />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentManagement />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseManagement />
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <IncomeManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
