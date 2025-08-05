
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Student, CreateStudentInput, User, Class } from '../../../server/src/schema';

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateStudentInput>({
    student_id: '',
    full_name: '',
    date_of_birth: new Date(),
    parent_id: 0,
    class_id: 0,
    enrollment_date: new Date(),
    is_active: true
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [studentsData, classesData] = await Promise.all([
        trpc.getAllStudents.query(),
        trpc.getClasses.query()
      ]);
      
      setStudents(studentsData);
      setClasses(classesData);
      
      // Note: In real implementation, you'd have a getParents endpoint
      // For now, we'll simulate parent data
      setParents([]);
      
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load student data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.parent_id === 0 || formData.class_id === 0) {
      setError('Please select both a parent and a class');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newStudent = await trpc.createStudent.mutate(formData);
      setStudents((prev: Student[]) => [...prev, newStudent]);
      
      // Reset form
      setFormData({
        student_id: '',
        full_name: '',
        date_of_birth: new Date(),
        parent_id: 0,
        class_id: 0,
        enrollment_date: new Date(),
        is_active: true
      });
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to create student:', err);
      setError('Failed to create student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClassName = (classId: number) => {
    const classItem = classes.find((c: Class) => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const getParentName = (parentId: number) => {
    const parent = parents.find((p: User) => p.id === parentId);
    return parent ? parent.full_name : `Parent ID: ${parentId}`;
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
          <h3 className="text-lg font-semibold">Student Management</h3>
          <p className="text-sm text-gray-600">Manage student enrollments and information</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                
                Enter the student's information to create a new enrollment.
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
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      value={formData.student_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateStudentInput) => ({ ...prev, student_id: e.target.value }))
                      }
                      placeholder="e.g., STD001"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateStudentInput) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="Student's full name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.date_of_birth, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date_of_birth}
                          onSelect={(date: Date | undefined) =>
                            date && setFormData((prev: CreateStudentInput) => ({ ...prev, date_of_birth: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Enrollment Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.enrollment_date, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.enrollment_date}
                          onSelect={(date: Date | undefined) =>
                            date && setFormData((prev: CreateStudentInput) => ({ ...prev, enrollment_date: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parent</Label>
                    <Select
                      value={formData.parent_id.toString()}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateStudentInput) => ({ ...prev, parent_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {parents.length === 0 ? (
                          <SelectItem value="0" disabled>No parents available</SelectItem>
                        ) : (
                          parents.map((parent: User) => (
                            <SelectItem key={parent.id} value={parent.id.toString()}>
                              {parent.full_name} ({parent.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select
                      value={formData.class_id.toString()}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateStudentInput) => ({ ...prev, class_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((classItem: Class) => (
                          <SelectItem key={classItem.id} value={classItem.id.toString()}>
                            {classItem.name} - Rp {classItem.monthly_fee.toLocaleString()}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Student'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👶</div>
              <h3 className="text-lg font-semibold mb-2">No Students Yet</h3>
              <p className="text-gray-600">Add your first student to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{getClassName(student.class_id)}</TableCell>
                      <TableCell>{getParentName(student.parent_id)}</TableCell>
                      <TableCell>{student.enrollment_date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? 'default' : 'secondary'}>
                          {student.is_active ? 'Active' : 'Inactive'}
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
