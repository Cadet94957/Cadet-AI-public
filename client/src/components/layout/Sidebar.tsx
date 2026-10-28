import { Link } from 'wouter';
import {
  Home,
  MessageSquare,
  BookOpen,
  Folder,
  Settings as SettingsIcon,
  LogOut,
  Users,
  Cloud,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface UserProgress {
  onboardingStep?: number;
  onboardingCompletedAt?: string;
}

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth();

  const isManager = user?.role === 'manager';

  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: [`/api/user-progress/${user?.email}`],
    enabled: !!user?.email && !isManager,
  });

  const hasCompletedOnboarding = userProgress?.onboardingCompletedAt || 
    (userProgress?.onboardingStep && userProgress.onboardingStep >= 9);

  const handleLogout = async () => {
    await signOut();
  };

  const employeeLinks = hasCompletedOnboarding ? [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Assistant', href: '/chatbot', icon: MessageSquare },
    { label: 'Study Materials', href: '/study-materials', icon: BookOpen },
    { label: 'Repository', href: '/repository', icon: Folder },
    { label: 'Cloud Storage', href: '/cloud-integrations', icon: Cloud },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ] : [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Onboarding', href: '/onboarding', icon: Home },
    { label: 'AI Assistant', href: '/chatbot', icon: MessageSquare },
    { label: 'Study Materials', href: '/study-materials', icon: BookOpen },
    { label: 'Repository', href: '/repository', icon: Folder },
    { label: 'Cloud Storage', href: '/cloud-integrations', icon: Cloud },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const managerLinks = [
    { label: 'Dashboard', href: '/manager-dashboard', icon: LayoutDashboard },
    { label: 'Employees', href: '/manager/employees', icon: Users },
    { label: 'Study Materials', href: '/manager/study-materials', icon: BookOpen },
    { label: 'Repository', href: '/manager/repository', icon: Folder },
    { label: 'AI Assistant', href: '/manager/chatbot', icon: MessageSquare },
    { label: 'Cloud Storage', href: '/manager/cloud-integrations', icon: Cloud },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const allLinks = isManager ? managerLinks : employeeLinks;

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40 shadow-sm ${isOpen ? 'block' : 'hidden'} md:block`}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex-1 text-center">
          <h2 className="text-3xl font-light tracking-wide text-gray-800">CADET</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      <nav className="p-4 space-y-1">
        {allLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors text-gray-700">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
