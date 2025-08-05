
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Payment } from '../../../server/src/schema';

export function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Note: In real implementation, you'd have a getAllPayments endpoint
      // For now, we'll use an empty array since handlers are stubs
      setPayments([]);
      
    } catch (err) {
      console.error('Failed to load payments:', err);
      setError('Failed to load payment data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleGenerateReceipt = async (paymentId: number) => {
    try {
      await trpc.generatePaymentReceipt.mutate({ payment_id: paymentId });
      alert('Receipt generated successfully!');
    } catch (err) {
      console.error('Failed to generate receipt:', err);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  const getPaymentMethodEmoji = (method: string) => {
    switch (method) {
      case 'bank_transfer': return '🏦';
      case 'credit_card': return '💳';
      case 'digital_wallet': return '📱';
      case 'cash': return '💵';
      default: return '💰';
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
        <h3 className="text-lg font-semibold">Payment Management</h3>
        <p className="text-sm text-gray-600">View and manage all payment transactions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
              <p className="text-gray-600">Payments will appear here once processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Bill ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">#{payment.id}</TableCell>
                      <TableCell>#{payment.bill_id}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        Rp {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{getPaymentMethodEmoji(payment.payment_method)}</span>
                          <span className="capitalize">
                            {payment.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.payment_date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            payment.status === 'completed' ? 'default' : 
                            payment.status === 'failed' ? 'destructive' : 
                            payment.status === 'refunded' ? 'secondary' : 'outline'
                          }
                        >
                          {payment.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateReceipt(payment.id)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Receipt
                          </Button>
                          {payment.receipt_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(payment.receipt_url!, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
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
