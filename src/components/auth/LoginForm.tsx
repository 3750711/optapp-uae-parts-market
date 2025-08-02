import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error('Ошибка входа', {
          description: error.message,
        });
      } else {
        toast.success('Добро пожаловать!');
      }
    } catch (error) {
      toast.error('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-card-elegant border border-border/20 p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Вход</h2>
          <p className="text-muted-foreground">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
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
              Пароль
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
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Забыли пароль?
          </Link>
          
          <div className="text-sm text-muted-foreground">
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;