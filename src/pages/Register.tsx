
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 6,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear email exists error when user changes email
    if (name === 'email' && emailExists) {
      setEmailExists(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError('Пароль не соответствует требованиям');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          setEmailExists(true);
          setError('Пользователь с таким email уже существует');
        } else {
          setError(error.message || 'Произошла ошибка при регистрации');
        }
      } else {
        toast({
          title: "Регистрация успешна!",
          description: "Проверьте вашу почту для подтверждения аккаунта",
        });
        navigate('/login');
      }
    } catch (err) {
      setError('Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
            <CardDescription className="text-center">
              Создайте аккаунт для продолжения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Полное имя</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Введите ваше полное имя"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Введите ваш email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={emailExists ? "border-red-500" : ""}
                />
                {emailExists && (
                  <div className="flex items-center text-red-500 text-sm">
                    <XCircle className="h-4 w-4 mr-1" />
                    Email уже используется
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+971 XX XXX XXXX"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {formData.password && (
                  <div className="space-y-1 text-sm">
                    <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordValidation.minLength ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Минимум 6 символов
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordValidation.hasNumber ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Содержит цифру
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasLetter ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordValidation.hasLetter ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Содержит букву
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="flex items-center text-red-500 text-sm">
                    <XCircle className="h-4 w-4 mr-1" />
                    Пароли не совпадают
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isPasswordValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрируем...
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <div className="text-sm text-gray-600">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Войти
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
