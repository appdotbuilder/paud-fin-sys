
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Payment } from '../../../server/src/schema';

interface ParentPaymentHistoryProps {
  parentId: number;
}

interface PaymentWithBillInfo extends Payment {
  bill_title?: string;
  student_name?: string;
}

export function ParentPaymentHistory({ parentId }: ParentPaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentWithBillInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const paymentHistory = await trpc.getPaymentHistoryByParent.query({ parent_id: parentId });
      setPayments(paymentHistory);
      
    } catch (err) {
      console.error('Failed to load payment history:', err);
      setError('Failed to load payment history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      await trpc.generatePaymentReceipt.mutate({ payment_id: paymentId });
      alert('Receipt downloaded successfully!');
    } catch (err) {
      console.error('Failed to download receipt:', err);
      alert('Failed to download receipt. Please try again.');
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
        <h3 className="text-lg font-semibold">Payment History</h3>
        <p className="text-sm text-gray-600">Your complete payment transaction history</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            {payments.length} payment{payments.length !== 1 ? 's' : ''} made
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
              <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
              <p className="text-gray-600">Your payment transactions will appear here once you make payments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: PaymentWithBillInfo) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.payment_date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.bill_title || `Bill #${payment.bill_id}`}
                          </p>
                          {payment.student_name && (
                            <p className="text-sm text-gray-600">{payment.student_name}</p>
                          )}
                          {payment.reference_number && (
                            <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{getPaymentMethodEmoji(payment.payment_method)}</span>
                          <span className="capitalize text-sm">
                            {payment.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        Rp {payment.amount.toLocaleString()}
                      </TableCell>
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
                            onClick={() => handleDownloadReceipt(payment.id)}
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
