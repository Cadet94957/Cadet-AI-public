import { Bell, HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <div className="flex items-center">
          <HamburgerMenu />
        </div>
        
        {/* CADET Title */}
        <h1 className="text-2xl font-bold tracking-wide text-gray-800 leading-none">CADET</h1>
        
        {/* Search */}
        <div className="relative hidden md:flex items-center ml-4">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search documents, conversations..." 
            className="w-96 pl-10 bg-gray-50 border-gray-200 focus:bg-white" 
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">New onboarding doc is ready</span>
              <span className="text-sm text-gray-500">2 minutes ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">Presentation finalized</span>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/faq" target="_blank" rel="noreferrer">Documentation</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="mailto:support@cadet.ai">Contact Support</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/bug-report" target="_blank" rel="noreferrer">Report a Bug</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
