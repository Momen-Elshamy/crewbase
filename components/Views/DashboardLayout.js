import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, CheckSquare, Users, Zap } from 'lucide-react';
import { cn } from '@/src/lib/cn';
import { useCompany } from '@/src/lib/CompanyContext';
import { ScrollArea } from '@/components/UI/ScrollArea';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/members', label: 'Members', icon: Users },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { activeCompany } = useCompany();

  return (
    <div className="dark flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-lg">Crewbase</span>
          </Link>
          {activeCompany && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{activeCompany.name}</p>
          )}
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
