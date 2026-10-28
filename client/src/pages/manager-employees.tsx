import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar, 
  MoreVertical, 
  MessageSquare, 
  FileText,
  TrendingUp,
  Clock
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { MessageEmployeeDialog } from '@/components/MessageEmployeeDialog';

interface Employee {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  joinDate?: string;
  onboardingProgress?: number;
  lastActive?: string;
  status: 'active' | 'pending' | 'completed';
}

export default function ManagerEmployees() {
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: number;
    displayName: string;
    email: string;
  } | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const { data: employees, isLoading } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const { data: currentUser } = useQuery<{ id: number; displayName?: string; role?: string }>({
    queryKey: ['/api/me'],
  });

  // Filter out managers and focus on employees
  const employeeList: Employee[] = employees?.filter((user: any) => user.role === 'employee').map((user: any) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    joinDate: '2025-01-15', // Mock data for demo
    onboardingProgress: Math.floor(Math.random() * 100), // Mock progress
    lastActive: '2 hours ago', // Mock activity
    status: Math.random() > 0.5 ? 'active' : 'pending' as 'active' | 'pending'
  })) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSendMessage = (employee: Employee) => {
    setSelectedEmployee({
      id: employee.id,
      displayName: employee.displayName,
      email: employee.email,
    });
    setIsMessageDialogOpen(true);
  };

  const handleCloseMessageDialog = () => {
    setIsMessageDialogOpen(false);
    setSelectedEmployee(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Employees</h1>
          <p className="text-muted-foreground">
            Loading employee information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Employees</h1>
            <p className="text-muted-foreground">
              Monitor and manage your team's onboarding progress
            </p>
          </div>
          <Button>
            <User className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeList.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Onboarding</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employeeList.filter(emp => emp.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employeeList.filter(emp => emp.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(employeeList.reduce((acc, emp) => acc + (emp.onboardingProgress || 0), 0) / employeeList.length || 0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employeeList.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {employee.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{employee.displayName}</CardTitle>
                      <CardDescription className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        {employee.email}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSendMessage(employee)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        View Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Edit Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Onboarding Progress</span>
                    <span className="text-sm font-medium">{employee.onboardingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(employee.onboardingProgress || 0)}`}
                      style={{ width: `${employee.onboardingProgress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Joined {employee.joinDate}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {employee.lastActive}
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleSendMessage(employee)}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="mr-1 h-3 w-3" />
                    Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {employeeList.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                You don't have any employees under your management yet.
              </p>
              <Button>
                <User className="mr-2 h-4 w-4" />
                Add First Employee
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Message Dialog */}
        <MessageEmployeeDialog
          employee={selectedEmployee}
          isOpen={isMessageDialogOpen}
          onClose={handleCloseMessageDialog}
          managerName={currentUser?.displayName || 'Manager'}
        />
      </div>
  );
}