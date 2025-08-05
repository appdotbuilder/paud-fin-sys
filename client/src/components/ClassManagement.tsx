
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Class, CreateClassInput } from '../../../server/src/schema';

export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateClassInput>({
    name: '',
    description: null,
    monthly_fee: 0,
    is_active: true
  });

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const classesData = await trpc.getClasses.query();
      setClasses(classesData);
    } catch (err) {
      console.error('Failed to load classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const newClass = await trpc.createClass.mutate(formData);
      setClasses((prev: Class[]) => [...prev, newClass]);
      
      // Reset form
      setFormData({
        name: '',
        description: null,
        monthly_fee: 0,
        is_active: true
      });
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to create class:', err);
      setError('Failed to create class. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Class Management</h3>
          <p className="text-sm text-gray-600">Manage educational classes and their fees</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Create a new class with monthly fee structure.
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
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateClassInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Toddler A, Pre-K B"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateClassInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Class description, age range, etc."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_fee">Monthly Fee (Rp)</Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    value={formData.monthly_fee}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateClassInput) => ({ 
                        ...prev, 
                        monthly_fee: parseFloat(e.target.value) || 0 
                      }))
                    }
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Class'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : classes.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">🏫</div>
                <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
                <p className="text-gray-600">Create your first class to get started.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          classes.map((classItem: Class) => (
            <Card key={classItem.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                    {classItem.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {classItem.description && (
                  <CardDescription>{classItem.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    Rp {classItem.monthly_fee.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">per month</p>
                  <div className="text-xs text-gray-500">
                    Created: {classItem.created_at.toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
