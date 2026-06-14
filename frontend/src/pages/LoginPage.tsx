import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export function LoginPage() {
  const { login, authConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppHeader subtitle="Sign In" />
      <main className="max-w-md mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-[var(--color-primary)]" />
              Sign In
            </CardTitle>
            <CardDescription>
              {authConfig?.mode === 'cognito'
                ? 'Sign in with your AWS Cognito account'
                : 'Sign in with your Motherson Innovations account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-[var(--color-destructive)]">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {authConfig?.mode === 'local' && (
              <div className="mt-6 p-3 rounded-md bg-[var(--color-muted)] text-xs text-[var(--color-muted-foreground)] space-y-1">
                <p className="font-medium text-[var(--color-foreground)]">Local dev accounts</p>
                <p>Admin: admin@motherson.com / Admin123!</p>
                <p>User: user@motherson.com / User123!</p>
              </div>
            )}

            {authConfig?.mode === 'cognito' && (
              <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
                Admin access requires membership in the Cognito <strong>admin</strong> group.
                Standard users belong to the <strong>user</strong> group.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
