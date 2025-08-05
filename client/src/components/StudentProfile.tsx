
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, GraduationCap } from 'lucide-react';
import type { Student } from '../../../server/src/schema';

interface StudentProfileProps {
  students: Student[];
}

export function StudentProfile({ students }: StudentProfileProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Student Profile</h3>
        <p className="text-sm text-gray-600">Your children's enrollment information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {students.map((student: Student) => (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {student.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{student.full_name}</CardTitle>
                    <CardDescription>Student ID: {student.student_id}</CardDescription>
                  </div>
                </div>
                <Badge variant={student.is_active ? 'default' : 'secondary'}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Date of Birth</p>
                      <p className="text-gray-600">{student.date_of_birth.toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Class</p>
                      <p className="text-gray-600">Class ID: {student.class_id}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-500">Enrollment Date</p>
                    <p className="text-gray-900">{student.enrollment_date.toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-500">Age</p>
                    <p className="text-gray-900">
                      {Math.floor((new Date().getTime() - student.date_of_birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Registration Details</p>
                  <p className="text-sm text-gray-700">
                    Enrolled on {student.enrollment_date.toLocaleDateString()} with student ID {student.student_id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {students.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">👶</div>
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-gray-600">
              Please contact the administrator to enroll your child.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
