import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LoginFormProps {
  language?: 'ru' | 'en';
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

const LoginForm: React.FC<LoginFormProps> = ({ language = 'ru' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const t = getLoginFormTranslations(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error(t.errorTitle, {
          description: error.message,
        });
      } else {
        toast.success(t.welcome);
      }
    } catch (error) {
      toast.error(t.generalError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-card-elegant border border-border/20 p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

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
      </div>
    </div>
  );
};

export default LoginForm;