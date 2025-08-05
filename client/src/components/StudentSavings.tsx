
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Student, Savings } from '../../../server/src/schema';

interface StudentSavingsProps {
  students: Student[];
}

interface SavingsBalance {
  studentId: number;
  balance: number;
}

export function StudentSavings({ students }: StudentSavingsProps) {
  const [savingsTransactions, setSavingsTransactions] = useState<Savings[]>([]);
  const [savingsBalances, setSavingsBalances] = useState<SavingsBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number>(0);

  const loadSavingsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load savings data for all students
      const balancePromises = students.map(async (student: Student) => {
        try {
          const balance = await trpc.getStudentSavingsBalance.query({ student_id: student.id });
          return { studentId: student.id, balance: balance || 0 };
        } catch {
          return { studentId: student.id, balance: 0 };
        }
      });
      
      const balances = await Promise.all(balancePromises);
      setSavingsBalances(balances);
      
      // Load transactions for selected student (or first student)
      if (students.length > 0) {
        const studentId = selectedStudent || students[0].id;
        const transactions = await trpc.getSavingsByStudent.query({ student_id: studentId });
        setSavingsTransactions(transactions);
      }
      
    } catch (err) {
      console.error('Failed to load savings data:', err);
      setError('Failed to load savings data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [students, selectedStudent]);

  useEffect(() => {
    if (students.length > 0) {
      loadSavingsData();
    }
  }, [loadSavingsData, students.length]);

  const getStudentBalance = (studentId: number) => {
    const balance = savingsBalances.find((b: SavingsBalance) => b.studentId === studentId);
    return balance ? balance.balance : 0;
  };

  const handleStudentChange = (studentId: number) => {
    setSelectedStudent(studentId);
  };

  const totalSavings = savingsBalances.reduce((sum: number, balance: SavingsBalance) => sum + balance.balance, 0);

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">🏦</div>
          <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
          <p className="text-gray-600">
            Students need to be enrolled to access savings features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Student Savings</h3>
        <p className="text-sm text-gray-600">Track your children's savings accounts and transactions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Savings Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PiggyBank className="w-5 h-5 text-pink-600" />
              <span>Total Family Savings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              Rp {totalSavings.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Across {students.length} student{students.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {students.map((student: Student) => (
          <Card key={student.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
                <span>{student.full_name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rp {getStudentBalance(student.id).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Current balance</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Savings Transactions</CardTitle>
              <p className="text-sm text-gray-600">Transaction history for your children</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select
                value={selectedStudent?.toString() || students[0]?.id.toString() || 'no-student'}
                onValueChange={(value: string) => value !== 'no-student' && handleStudentChange(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <SelectItem value="no-student" disabled>No students available</SelectItem>
                  ) : (
                    students.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                </div>
              ))}
            </div>
          ) : savingsTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏦</div>
              <h3 className="text-lg font-semibold mb-2">No Savings Transactions</h3>
              <p className="text-gray-600">Savings transactions will appear here once deposits or withdrawals are made.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savingsTransactions.map((transaction: Savings) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.transaction_date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {transaction.transaction_type === 'deposit' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <Badge 
                            variant={transaction.transaction_type === 'deposit' ? 'default' : 'secondary'}
                            className={transaction.transaction_type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {transaction.transaction_type.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.description || 'No description'}
                      </TableCell>
                      <TableCell className={`font-semibold ${
                        transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'deposit' ? '+' : '-'}Rp {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        Rp {transaction.balance_after.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
