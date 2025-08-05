
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
import type { Bill, CreateBillInput, Student, BillType } from '../../../server/src/schema';

export function BillManagement() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateBillInput>({
    student_id: 0,
    bill_type: 'monthly_fee',
    title: '',
    description: null,
    amount: 0,
    due_date: new Date()
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const studentsData = await trpc.getAllStudents.query();
      setStudents(studentsData);
      
      // Note: In real implementation, you'd have a getAllBills endpoint
      // For now, we'll use an empty array since handlers are stubs
      setBills([]);
      
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load bill data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.student_id === 0) {
      setError('Please select a student');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newBill = await trpc.createBill.mutate(formData);
      setBills((prev: Bill[]) => [...prev, newBill]);
      
      // Reset form
      setFormData({
        student_id: 0,
        bill_type: 'monthly_fee',
        title: '',
        description: null,
        amount: 0,
        due_date: new Date()
      });
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to create bill:', err);
      setError('Failed to create bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStudentName = (studentId: number) => {
    const student = students.find((s: Student) => s.id === studentId);
    return student ? `${student.full_name} (${student.student_id})` : 'Unknown Student';
  };

  const billTypes: { value: BillType; label: string; emoji: string }[] = [
    { value: 'monthly_fee', label: 'Monthly Fee', emoji: '📅' },
    { value: 'registration', label: 'Registration', emoji: '📝' },
    { value: 'activity', label: 'Activity', emoji: '🎨' },
    { value: 'uniform', label: 'Uniform', emoji: '👕' },
    { value: 'book', label: 'Books', emoji: '📚' },
    { value: 'other', label: 'Other', emoji: '📄' }
  ];

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
          <h3 className="text-lg font-semibold">Bill Management</h3>
          <p className="text-sm text-gray-600">Create and manage student bills</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Bill</DialogTitle>
              <DialogDescription>
                Generate a new bill for a student.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select
                    value={
                      formData.student_id === 0 
                        ? (students.length === 0 ? 'no-students' : 'select-student')
                        : formData.student_id.toString()
                    }
                    onValueChange={(value: string) => {
                      if (value !== 'select-student' && value !== 'no-students') {
                        setFormData((prev: CreateBillInput) => ({ ...prev, student_id: parseInt(value) }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length === 0 ? (
                        <SelectItem value="no-students" disabled>
                          No students available
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="select-student" disabled>
                            Select student
                          </SelectItem>
                          {students.map((student: Student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.full_name} ({student.student_id})
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bill Type</Label>
                    <Select
                      value={formData.bill_type}
                      onValueChange={(value: BillType) =>
                        setFormData((prev: CreateBillInput) => ({ ...prev, bill_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {billTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.emoji} {type.label}
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
                        setFormData((prev: CreateBillInput) => ({ 
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
                  <Label htmlFor="title">Bill Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBillInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., Monthly Fee - January 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateBillInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Additional bill details"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.due_date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date: Date | undefined) =>
                          date && setFormData((prev: CreateBillInput) => ({ ...prev, due_date: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Bill'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>
            {bills.length} bill{bills.length !== 1 ? 's' : ''} generated
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
          ) : bills.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-semibold mb-2">No Bills Yet</h3>
              <p className="text-gray-600">Create your first bill to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill: Bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{getStudentName(bill.student_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {bill.bill_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{bill.title}</TableCell>
                      <TableCell>Rp {bill.amount.toLocaleString()}</TableCell>
                      <TableCell>{bill.due_date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            bill.status === 'paid' ? 'default' : 
                            bill.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                        >
                          {bill.status.toUpperCase()}
                        </Badge>
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
