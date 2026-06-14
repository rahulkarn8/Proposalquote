import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, User } from 'lucide-react';

interface AppHeaderProps {
  subtitle?: string;
  children?: React.ReactNode;
}

export function AppHeader({ subtitle = 'AI Solution Quote Generator', children }: AppHeaderProps) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-4 group">
          <img
            src="/motherson-logo.svg"
            alt="Motherson Innovations"
            className="h-8 w-auto"
          />
          <div className="hidden sm:block border-l border-[var(--color-border)] pl-4">
            <p className="text-sm font-medium text-[var(--color-foreground)] leading-tight">
              {subtitle}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Proud to be part of the future
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {children}
          {user && (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4" /> Admin
                  </Button>
                </Link>
              )}
              <div className="hidden md:flex items-center gap-2 text-sm px-2">
                <User className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                <span>{user.name ?? user.email}</span>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>{user.role}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
