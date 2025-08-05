
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { StudentProfile } from '@/components/StudentProfile';
import { ParentBills } from '@/components/ParentBills';
import { ParentPaymentHistory } from '@/components/ParentPaymentHistory';
import { StudentSavings } from '@/components/StudentSavings';
import type { User, Student, Bill } from '../../../server/src/schema';

interface ParentDashboardProps {
  user: User;
}

export function ParentDashboard({ user }: ParentDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeBills, setActiveBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load parent's students
      const studentsData = await trpc.getStudentsByParent.query({ parent_id: user.id });
      setStudents(studentsData);
      
      // Load active bills for parent
      const billsData = await trpc.getActiveBillsByParent.query({ parent_id: user.id });
      setActiveBills(billsData);
      
    } catch (err) {
      console.error('Failed to load parent data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  const totalOutstanding = activeBills.reduce((sum: number, bill: Bill) => sum + bill.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-lg">
          <div className="animate-pulse">
            <div className="h-8 bg-green-500 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-green-400 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">👨‍👩‍👧‍👦 Parent Portal</h2>
        <p className="text-green-100">
          Welcome back! Manage your child's education finances and track their progress.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Children</CardTitle>
            <span className="text-2xl">👶</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {students.length === 1 ? 'student enrolled' : 'students enrolled'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bills</CardTitle>
            <span className="text-2xl">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBills.length}</div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {totalOutstanding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total due</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Management Tabs */}
      {students.length > 0 ? (
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">👶 Student Profile</TabsTrigger>
            <TabsTrigger value="bills">📄 Active Bills</TabsTrigger>
            <TabsTrigger value="payments">💳 Payment History</TabsTrigger>
            <TabsTrigger value="savings">🏦 Savings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <StudentProfile students={students} />
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <ParentBills parentId={user.id} onPaymentSuccess={loadParentData} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <ParentPaymentHistory parentId={user.id} />
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <StudentSavings students={students} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-gray-600 mb-4">
              It looks like you don't have any children enrolled yet.
            </p>
            <p className="text-sm text-gray-500">
              Please contact the administrator to enroll your child.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
