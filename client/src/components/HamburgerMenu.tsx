import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  BookOpen,
  Folder,
  Users,
  Cloud,
  Settings,
  LogOut,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

interface UserProgress {
  onboardingStep?: number;
  onboardingCompletedAt?: string;
}

interface MenuItem {
  label: string;
  path?: string;
  action?: 'logout';
  icon?: LucideIcon;
  isDivider?: boolean;
}

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  const itemHeight = 36;
  const dividerHeight = 9;

  const isMainPage = !location.startsWith('/onboarding') && 
                     !location.startsWith('/admin-onboarding') && 
                     location !== '/login';

  const isManager = user?.role === 'manager';

  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: [`/api/user-progress/${user?.email}`],
    enabled: !!user?.email && !isManager,
  });

  const hasCompletedOnboarding = userProgress?.onboardingCompletedAt || 
    (userProgress?.onboardingStep && userProgress.onboardingStep >= 9);

  const managerNavigationItems: MenuItem[] = [
    { label: 'Dashboard', path: '/manager-dashboard', icon: LayoutDashboard },
    { label: 'Employees', path: '/manager/employees', icon: Users },
    { label: 'Materials', path: '/manager/study-materials', icon: BookOpen },
    { label: 'Repository', path: '/manager/repository', icon: Folder },
    { label: 'Assistant', path: '/manager/chatbot', icon: MessageSquare },
    { label: 'Cloud Storage', path: '/manager/cloud-integrations', icon: Cloud },
  ];

  const employeeNavigationItems: MenuItem[] = hasCompletedOnboarding ? [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Assistant', path: '/chatbot', icon: MessageSquare },
    { label: 'Materials', path: '/study-materials', icon: BookOpen },
    { label: 'Repository', path: '/repository', icon: Folder },
    { label: 'Cloud Storage', path: '/cloud-integrations', icon: Cloud },
  ] : [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Onboarding', path: '/onboarding', icon: Home },
    { label: 'Assistant', path: '/chatbot', icon: MessageSquare },
    { label: 'Materials', path: '/study-materials', icon: BookOpen },
    { label: 'Repository', path: '/repository', icon: Folder },
    { label: 'Cloud Storage', path: '/cloud-integrations', icon: Cloud },
  ];

  const navigationItems = isManager ? managerNavigationItems : employeeNavigationItems;

  const settingsItems: MenuItem[] = [
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Logout', action: 'logout', icon: LogOut },
  ];

  const simpleMenuItems: MenuItem[] = [
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Assistant', path: '/chatbot', icon: MessageSquare },
    { label: 'Logout', action: 'logout', icon: LogOut },
  ];

  const allItems: MenuItem[] = isMainPage 
    ? [...navigationItems, { label: 'divider', isDivider: true }, ...settingsItems]
    : simpleMenuItems;

  const menuItemCount = allItems.filter(item => !item.isDivider).length;
  const hasDivider = allItems.some(item => item.isDivider);
  const menuHeight = menuItemCount * itemHeight + (hasDivider ? dividerHeight : 0) + 8;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = async (item: MenuItem) => {
    if (item.action === 'logout') {
      await signOut();
      setLocation('/login');
    } else if (item.path) {
      setLocation(item.path);
    }
    setIsOpen(false);
  };

  const buttonHeight = 24;
  const menuOffsetTop = buttonHeight + 8;

  let itemIndex = 0;

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-6 h-6 flex flex-col justify-center items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        aria-expanded={isOpen}
        aria-controls="hamburger-menu"
        data-testid="button-hamburger"
        style={{ zIndex: 30 }}
      >
        {[0, 1, 2].map((lineIndex) => (
          <div
            key={`hamburger-line-${lineIndex}`}
            className="w-5 h-0.5 bg-gray-700 transition-all duration-300 ease-out"
            style={{
              opacity: isOpen ? 0 : 1,
            }}
          />
        ))}
      </button>

      <div
        className={`absolute rounded-xl shadow-lg transition-all duration-300 ease-out flex flex-col overflow-hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          top: `${menuOffsetTop}px`,
          left: '0px',
          width: '200px',
          height: `${menuHeight}px`,
          backgroundColor: '#F8F8F0',
          border: '1px solid #e5e5e5',
          zIndex: 15,
          paddingTop: '4px',
          paddingBottom: '4px',
        }}
      >
        {allItems.map((item, index) => {
          if (item.isDivider) {
            return (
              <div 
                key="divider" 
                className="mx-4 my-1 border-t border-gray-300"
                style={{ height: '1px' }}
              />
            );
          }

          const currentItemIndex = itemIndex++;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-out font-light tracking-wide text-sm ${
                isOpen 
                  ? 'opacity-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
              style={{
                transitionDelay: isOpen ? `${(currentItemIndex * 40) + 100}ms` : '0ms',
              }}
              data-testid={`button-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {IconComponent && <IconComponent className="w-4 h-4" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
