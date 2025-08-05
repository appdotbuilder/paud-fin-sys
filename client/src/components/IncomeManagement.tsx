
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
import type { OtherIncome, CreateOtherIncomeInput, IncomeCategory } from '../../../server/src/schema';

export function IncomeManagement() {
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateOtherIncomeInput>({
    category: 'other',
    title: '',
    description: null,
    amount: 0,
    income_date: new Date(),
    created_by: 1 // This should be the current user's ID
  });

  const loadIncomes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const incomesData = await trpc.getOtherIncomes.query();
      setIncomes(incomesData);
    } catch (err) {
      console.error('Failed to load incomes:', err);
      setError('Failed to load incomes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const newIncome = await trpc.createOtherIncome.mutate(formData);
      setIncomes((prev: OtherIncome[]) => [...prev, newIncome]);
      
      // Reset form
      setFormData({
        category: 'other',
        title: '',
        description: null,
        amount: 0,
        income_date: new Date(),
        created_by: 1
      });
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to create income:', err);
      setError('Failed to create income. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const incomeCategories: { value: IncomeCategory; label: string; emoji: string }[] = [
    { value: 'donation', label: 'Donation', emoji: '💝' },
    { value: 'fundraising', label: 'Fundraising', emoji: '🎉' },
    { value: 'government_aid', label: 'Government Aid', emoji: '🏛️' },
    { value: 'investment', label: 'Investment', emoji: '📈' },
    { value: 'other', label: 'Other', emoji: '💰' }
  ];

  const totalIncome = incomes.reduce((sum: number, income: OtherIncome) => sum + income.amount, 0);

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
          <h3 className="text-lg font-semibold">Other Income Management</h3>
          <p className="text-sm text-gray-600">Track additional income sources beyond tuition fees</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Other Income</DialogTitle>
              <DialogDescription>
                Record additional income from donations, fundraising, or other sources.
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
                    <Label>Income Category</Label>
                    <Select
                      value={formData.category || 'other'}
                      onValueChange={(value: IncomeCategory) =>
                        setFormData((prev: CreateOtherIncomeInput) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeCategories.map((category) => (
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
                        setFormData((prev: CreateOtherIncomeInput) => ({ 
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
                  <Label htmlFor="title">Income Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateOtherIncomeInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., Annual Fundraising Event"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateOtherIncomeInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Additional income details"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Income Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.income_date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.income_date}
                        onSelect={(date: Date | undefined) =>
                          date && setFormData((prev: CreateOtherIncomeInput) => ({ ...prev, income_date: date }))
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
                  {isSubmitting ? 'Adding...' : 'Add Income'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Income Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">💰</span>
            <span>Total Other Income</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            Rp {totalIncome.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {incomes.length} income source{incomes.length !== 1 ? 's' : ''} recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Records</CardTitle>
          <CardDescription>
            Additional income sources beyond regular tuition fees
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
          ) : incomes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">No Additional Income Yet</h3>
              <p className="text-gray-600">Record donations, fundraising, and other income sources here.</p>
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
                  {incomes.map((income: OtherIncome) => (
                    <TableRow key={income.id}>
                      <TableCell>{income.income_date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {incomeCategories.find(c => c.value === income.category)?.emoji}{' '}
                          {income.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{income.title}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        Rp {income.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {income.description || '-'}
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
