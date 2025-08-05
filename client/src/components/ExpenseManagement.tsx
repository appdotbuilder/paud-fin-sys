
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { Expense, CreateExpenseInput, ExpenseCategory } from '../../../server/src/schema';

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateExpenseInput>({
    category: 'other',
    title: '',
    description: null,
    amount: 0,
    expense_date: new Date(),
    receipt_url: null,
    created_by: 1 // This should be the current user's ID
  });

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const expensesData = await trpc.getExpenses.query();
      setExpenses(expensesData);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const newExpense = await trpc.createExpense.mutate(formData);
      setExpenses((prev: Expense[]) => [...prev, newExpense]);
      
      // Reset form
      setFormData({
        category: 'other',
        title: '',
        description: null,
        amount: 0,
        expense_date: new Date(),
        receipt_url: null,
        created_by: 1
      });
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to create expense:', err);
      setError('Failed to create expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories: { value: ExpenseCategory; label: string; emoji: string }[] = [
    { value: 'salary', label: 'Salary', emoji: '💼' },
    { value: 'utilities', label: 'Utilities', emoji: '⚡' },
    { value: 'supplies', label: 'Supplies', emoji: '📦' },
    { value: 'maintenance', label: 'Maintenance', emoji: '🔧' },
    { value: 'food', label: 'Food', emoji: '🍎' },
    { value: 'transportation', label: 'Transportation', emoji: '🚌' },
    { value: 'marketing', label: 'Marketing', emoji: '📢' },
    { value: 'training', label: 'Training', emoji: '📚' },
    { value: 'other', label: 'Other', emoji: '💸' }
  ];

  const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);

  if (error && isLoading) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expense Management</h3>
          <p className="text-sm text-gray-600">Track and manage school operational expenses</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new operational expense for the school.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category || 'other'}
                      onValueChange={(value: ExpenseCategory) =>
                        setFormData((prev: CreateExpenseInput) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.emoji} {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (Rp)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      placeholder="0"
                      min="0"
                      step="1000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Expense Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., Monthly Electricity Bill"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Additional expense details"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expense Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.expense_date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expense_date}
                        onSelect={(date: Date | undefined) =>
                          date && setFormData((prev: CreateExpenseInput) => ({ ...prev, expense_date: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt_url">Receipt URL (Optional)</Label>
                  <Input
                    id="receipt_url"
                    value={formData.receipt_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({ 
                        ...prev, 
                        receipt_url: e.target.value || null 
                      }))
                    }
                    placeholder="https://example.com/receipt.pdf"
                    type="url"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">💸</span>
            <span>Total Expenses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            Rp {totalExpenses.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>
            All operational expenses for the school
          </CardDescription>
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
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-lg font-semibold mb-2">No Expenses Yet</h3>
              <p className="text-gray-600">Start tracking your school's operational expenses.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense: Expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.expense_date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {expenseCategories.find(c => c.value === expense.category)?.emoji}{' '}
                          {expense.category.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        Rp {expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description || '-'}
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
