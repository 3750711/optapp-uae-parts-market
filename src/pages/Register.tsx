import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, MapPin, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    telegram: '',
    location: 'Россия',
    userType: 'buyer' as 'buyer' | 'seller',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  
  const { user } = useAuth();
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      userType: value as 'buyer' | 'seller'
    }));
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
      // Use Supabase direct signUp instead of signUp from context
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            telegram: formData.telegram,
            location: formData.location,
            user_type: formData.userType,
          }
        }
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
        <Card className="w-full max-w-lg">
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
                <Label htmlFor="telegram">Telegram (опционально)</Label>
                <Input
                  id="telegram"
                  name="telegram"
                  type="text"
                  placeholder="@username или ссылка"
                  value={formData.telegram}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Страна
                  </div>
                </Label>
                <Select value={formData.location} onValueChange={(value) => handleSelectChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md max-h-[200px] overflow-y-auto z-50">
                    <SelectItem value="Россия">Россия</SelectItem>
                    <SelectItem value="Казахстан">Казахстан</SelectItem>
                    <SelectItem value="Беларусь">Беларусь</SelectItem>
                    <SelectItem value="Украина">Украина</SelectItem>
                    <SelectItem value="ОАЭ">ОАЭ (Объединенные Арабские Эмираты)</SelectItem>
                    <SelectItem value="Турция">Турция</SelectItem>
                    <SelectItem value="Грузия">Грузия</SelectItem>
                    <SelectItem value="Армения">Армения</SelectItem>
                    <SelectItem value="Азербайджан">Азербайджан</SelectItem>
                    <SelectItem value="Узбекистан">Узбекистан</SelectItem>
                    <SelectItem value="Киргизия">Киргизия</SelectItem>
                    <SelectItem value="Таджикистан">Таджикистан</SelectItem>
                    <SelectItem value="Туркменистан">Туркменистан</SelectItem>
                    <SelectItem value="Молдова">Молдова</SelectItem>
                    <SelectItem value="Литва">Литва</SelectItem>
                    <SelectItem value="Латвия">Латвия</SelectItem>
                    <SelectItem value="Эстония">Эстония</SelectItem>
                    <SelectItem value="Польша">Польша</SelectItem>
                    <SelectItem value="Чехия">Чехия</SelectItem>
                    <SelectItem value="Словакия">Словакия</SelectItem>
                    <SelectItem value="Венгрия">Венгрия</SelectItem>
                    <SelectItem value="Болгария">Болгария</SelectItem>
                    <SelectItem value="Румыния">Румыния</SelectItem>
                    <SelectItem value="Германия">Германия</SelectItem>
                    <SelectItem value="Франция">Франция</SelectItem>
                    <SelectItem value="Италия">Италия</SelectItem>
                    <SelectItem value="Испания">Испания</SelectItem>
                    <SelectItem value="Великобритания">Великобритания</SelectItem>
                    <SelectItem value="Нидерланды">Нидерланды</SelectItem>
                    <SelectItem value="Бельгия">Бельгия</SelectItem>
                    <SelectItem value="Швейцария">Швейцария</SelectItem>
                    <SelectItem value="Австрия">Австрия</SelectItem>
                    <SelectItem value="Норвегия">Норвегия</SelectItem>
                    <SelectItem value="Швеция">Швеция</SelectItem>
                    <SelectItem value="Финляндия">Финляндия</SelectItem>
                    <SelectItem value="Дания">Дания</SelectItem>
                    <SelectItem value="США">США</SelectItem>
                    <SelectItem value="Канада">Канада</SelectItem>
                    <SelectItem value="Мексика">Мексика</SelectItem>
                    <SelectItem value="Бразилия">Бразилия</SelectItem>
                    <SelectItem value="Аргентина">Аргентина</SelectItem>
                    <SelectItem value="Чили">Чили</SelectItem>
                    <SelectItem value="Китай">Китай</SelectItem>
                    <SelectItem value="Япония">Япония</SelectItem>
                    <SelectItem value="Южная Корея">Южная Корея</SelectItem>
                    <SelectItem value="Индия">Индия</SelectItem>
                    <SelectItem value="Таиланд">Таиланд</SelectItem>
                    <SelectItem value="Вьетнам">Вьетнам</SelectItem>
                    <SelectItem value="Сингапур">Сингапур</SelectItem>
                    <SelectItem value="Малайзия">Малайзия</SelectItem>
                    <SelectItem value="Индонезия">Индонезия</SelectItem>
                    <SelectItem value="Филиппины">Филиппины</SelectItem>
                    <SelectItem value="Австралия">Австралия</SelectItem>
                    <SelectItem value="Новая Зеландия">Новая Зеландия</SelectItem>
                    <SelectItem value="Египет">Египет</SelectItem>
                    <SelectItem value="Марокко">Марокко</SelectItem>
                    <SelectItem value="Тунис">Тунис</SelectItem>
                    <SelectItem value="Алжир">Алжир</SelectItem>
                    <SelectItem value="ЮАР">ЮАР</SelectItem>
                    <SelectItem value="Израиль">Израиль</SelectItem>
                    <SelectItem value="Саудовская Аравия">Саудовская Аравия</SelectItem>
                    <SelectItem value="Кувейт">Кувейт</SelectItem>
                    <SelectItem value="Катар">Катар</SelectItem>
                    <SelectItem value="Бахрейн">Бахрейн</SelectItem>
                    <SelectItem value="Оман">Оман</SelectItem>
                    <SelectItem value="Иран">Иран</SelectItem>
                    <SelectItem value="Ирак">Ирак</SelectItem>
                    <SelectItem value="Афганистан">Афганистан</SelectItem>
                    <SelectItem value="Пакистан">Пакистан</SelectItem>
                    <SelectItem value="Другая">Другая</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Тип аккаунта
                  </div>
                </Label>
                <RadioGroup value={formData.userType} onValueChange={handleUserTypeChange} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="text-sm font-normal cursor-pointer">
                      Покупатель - покупка автозапчастей
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="seller" id="seller" />
                    <Label htmlFor="seller" className="text-sm font-normal cursor-pointer">
                      Продавец - продажа автозапчастей
                    </Label>
                  </div>
                </RadioGroup>
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
