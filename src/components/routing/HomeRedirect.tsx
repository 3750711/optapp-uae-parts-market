import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Spinner = () => (
  <div className="flex h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function HomeRedirect({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // ждём, если профиль ещё не подтянулся
  if (isLoading || (user && !profile)) return <Spinner />;

  // гость — показываем домашнюю
  if (!user || !profile) return <>{children}</>;

  const role = profile.user_type as 'admin'|'seller'|'buyer'|string;
  const status = profile.verification_status as 'verified'|'pending'|'blocked'|string|undefined;
  const profileCompleted = !!profile.profile_completed;
  const authMethod = profile.auth_method;

  let target: string | null = null;

  if (status === 'blocked') target = '/';
  else if (status === 'pending' && role !== 'admin') target = '/pending-approval';
  else if (!profileCompleted && authMethod !== 'telegram')
    target = role === 'seller' ? '/seller/profile' : '/profile';
  else
    target = role === 'admin' ? '/admin'
      : role === 'seller' ? '/seller/dashboard'
      : role === 'buyer' ? '/buyer-dashboard'
      : null;

  if (target && location.pathname !== target) return <Navigate to={target} replace />;
  return <>{children}</>;
}