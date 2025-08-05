
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Bill, CreatePaymentInput, PaymentMethod } from '../../../server/src/schema';

interface ParentBillsProps {
  parentId: number;
  onPaymentSuccess: () => void;
}

export function ParentBills({ parentId, onPaymentSuccess }: ParentBillsProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  const loadBills = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const billsData = await trpc.getActiveBillsByParent.query({ parent_id: parentId });
      setBills(billsData);
    } catch (err) {
      console.error('Failed to load bills:', err);
      setError('Failed to load bills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedBill) return;

    setIsProcessingPayment(true);
    setError(null);

    try {
      const paymentData: CreatePaymentInput = {
        bill_id: selectedBill.id,
        amount: selectedBill.amount,
        payment_method: paymentMethod,
        payment_date: new Date(),
        reference_number: `PAY-${Date.now()}`,
        notes: `Payment for ${selectedBill.title}`
      };

      await trpc.createPayment.mutate(paymentData);
      
      // Close dialog and refresh data
      setIsPaymentDialogOpen(false);
      setSelectedBill(null);
      onPaymentSuccess();
      
      // Show success message (you might want to add a toast notification here)
      alert('Payment processed successfully!');
      
    } catch (err) {
      console.error('Payment failed:', err);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getBillTypeColor = (billType: string) => {
    switch (billType) {
      case 'monthly_fee': return 'bg-blue-500';
      case 'registration': return 'bg-green-500';
      case 'activity': return 'bg-purple-500';
      case 'uniform': return 'bg-orange-500';
      case 'book': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBillTypeEmoji = (billType: string) => {
    switch (billType) {
      case 'monthly_fee': return '📅';
      case 'registration': return '📝';
      case 'activity': return '🎨';
      case 'uniform': return '👕';
      case 'book': return '📚';
      default: return '📄';
    }
  };

  if (error && isLoading) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Active Bills</h3>
        <p className="text-sm text-gray-600">Outstanding payments for your children</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600">You have no outstanding bills at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bills.map((bill: Bill) => (
            <Card key={bill.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getBillTypeEmoji(bill.bill_type)}</span>
                    <div>
                      <CardTitle className="text-lg">{bill.title}</CardTitle>
                      <CardDescription>
                        {bill.bill_type.replace('_', ' ').toUpperCase()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={bill.status === 'overdue' ? 'destructive' : 'secondary'}
                    className={`${getBillTypeColor(bill.bill_type)} text-white`}
                  >
                    {bill.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bill.description && (
                    <p className="text-sm text-gray-600">{bill.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {bill.due_date.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        Rp {bill.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <Button 
                    className="w-full" 
                    onClick={() => handlePayBill(bill)}
                    variant={bill.status === 'overdue' ? 'destructive' : 'default'}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Complete the payment for: {selectedBill?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-green-600">
                    Rp {selectedBill.amount.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Due Date: {selectedBill.due_date.toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                    <SelectItem value="digital_wallet">📱 Digital Wallet</SelectItem>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button 
              onClick={processPayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
