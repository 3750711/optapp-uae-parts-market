import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimit } from '@/hooks/useRateLimit';
import { toast } from 'sonner';
import { detectInputType, getEmailByOptId } from '@/utils/authUtils';
import { logLoginFailure, logLoginSuccess, logRateLimitHit } from '@/utils/authLogger';

interface LoginFormProps {
  language?: 'ru' | 'en';
  compact?: boolean;
  hideHeader?: boolean;
  hideLinks?: boolean;
}

const getLoginFormTranslations = (language: 'ru' | 'en') => {
  const translations = {
    ru: {
      title: "Вход",
      subtitle: "Войдите в свой аккаунт",
      email: "Email",
      password: "Пароль",
      loading: "Вход...",
      submit: "Войти",
      forgotPassword: "Забыли пароль?",
      noAccount: "Нет аккаунта?",
      register: "Зарегистрироваться",
      errorTitle: "Ошибка входа",
      welcome: "Добро пожаловать!",
      generalError: "Произошла ошибка при входе"
    },
    en: {
      title: "Login",
      subtitle: "Sign in to your account",
      email: "Email",
      password: "Password",
      loading: "Signing in...",
      submit: "Sign In",
      forgotPassword: "Forgot password?",
      noAccount: "No account?",
      register: "Register",
      errorTitle: "Login error",
      welcome: "Welcome!",
      generalError: "An error occurred during login"
    }
  };
  return translations[language];
};

const LoginForm: React.FC<LoginFormProps> = ({ language = 'ru', compact = false, hideHeader = false, hideLinks = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { checkRateLimit } = useRateLimit();
  const t = getLoginFormTranslations(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Rate limiting check
      const allowed = await checkRateLimit('login', { limitPerHour: 5, windowMinutes: 60 });
      if (!allowed) {
        await logRateLimitHit('email', { email: email.substring(0, email.indexOf('@')) });
        setIsLoading(false);
        return;
      }

      // Detect input type and handle accordingly
      const inputType = detectInputType(email);
      let loginEmail = email;
      
      if (inputType === 'opt_id') {
        // Convert OPT ID to email
        const { email: foundEmail, isRateLimited } = await getEmailByOptId(email);
        
        if (isRateLimited) {
          await logRateLimitHit('opt_id', { optId: email });
          setIsLoading(false);
          return;
        }
        
        if (!foundEmail) {
          const errorMsg = 'OPT ID not found';
          await logLoginFailure('opt_id', errorMsg);
          toast.error(t.errorTitle, {
            description: 'OPT ID не найден',
          });
          setIsLoading(false);
          return;
        }
        
        loginEmail = foundEmail;
      }

      const { user, error } = await signIn(loginEmail, password);
      
      if (error) {
        await logLoginFailure(inputType === 'opt_id' ? 'opt_id' : 'email', error.message);
        toast.error(t.errorTitle, {
          description: error.message,
        });
      } else if (user) {
        await logLoginSuccess(inputType === 'opt_id' ? 'opt_id' : 'email', user.id);
        toast.success(t.welcome);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.generalError;
      await logLoginFailure('email', errorMessage);
      toast.error(t.generalError);
    } finally {
      setIsLoading(false);
    }
  };

return (
  <>
    {compact ? (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {t.email}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 border-border/60 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {t.password}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11 border-border/60 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-primary hover:hover-glow text-white font-medium rounded-lg transition-all duration-300"
        >
          {isLoading ? t.loading : t.submit}
        </Button>
      </form>
    ) : (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-card-elegant border border-border/20 p-8">
          {!hideHeader && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.title}</h2>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t.email}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-border/60 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t.password}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-border/60 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-primary hover:hover-glow text-white font-medium rounded-lg transition-all duration-300"
            >
              {isLoading ? t.loading : t.submit}
            </Button>
          </form>

          {!hideLinks && (
            <div className="mt-6 text-center space-y-3">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                {t.forgotPassword}
              </Link>

              <div className="text-sm text-muted-foreground">
                {t.noAccount}{' '}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  {t.register}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>
);
};

export default LoginForm;