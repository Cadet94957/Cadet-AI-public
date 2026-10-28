import { Link } from 'wouter';
import { FileText, MessageSquare, Users, BarChart3, Settings, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Manage onboarding, track progress, and support your team
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Active onboarding employees
              </p>
              <Link href="/manager/employees">
                <Button variant="outline" size="sm" className="mt-3">
                  Manage Employees
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Repository</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">
                Onboarding documents available
              </p>
              <Link href="/manager/repository">
                <Button variant="outline" size="sm" className="mt-3">
                  Manage Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Materials</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">
                Generated presentations
              </p>
              <Link href="/manager/study-materials">
                <Button variant="outline" size="sm" className="mt-3">
                  Create Materials
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                AI assistant interactions this week
              </p>
              <Link href="/manager/chatbot">
                <Button variant="outline" size="sm" className="mt-3">
                  View Insights
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onboarding Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Upcoming onboarding sessions
              </p>
              <Link href="/manager/schedule">
                <Button variant="outline" size="sm" className="mt-3">
                  View Schedule
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Configure onboarding workflows and preferences
              </p>
              <Link href="/manager/settings">
                <Button variant="outline" size="sm">
                  Manage Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest team onboarding activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Sarah Johnson completed Module 3</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">New presentation generated: "Company Policies"</p>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Mike Davis asked 12 questions via AI assistant</p>
                    <p className="text-xs text-muted-foreground">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/manager/repository">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload New Documents
                  </Button>
                </Link>
                <Link href="/manager/study-materials">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Training Material
                  </Button>
                </Link>
                <Link href="/manager/team-progress">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Review Team Progress
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}