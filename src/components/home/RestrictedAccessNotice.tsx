
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Users, ShieldCheck, ArrowRight } from 'lucide-react';

const RestrictedAccessNotice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Доступ ограничен
            </h1>
            
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
              Эта страница доступна только зарегистрированным пользователям. 
              Присоединяйтесь к эксклюзивному сообществу профессионалов автобизнеса.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">150+</h3>
                <p className="text-sm text-foreground/70">Проверенных поставщиков</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-secondary/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-1">Качество</h3>
                <p className="text-sm text-foreground/70">Гарантированное качество</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Эксклюзив</h3>
                <p className="text-sm text-foreground/70">Только для профессионалов</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" asChild>
                <Link to="/register">
                  <Users className="mr-2 h-5 w-5" />
                  Зарегистрироваться
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="group shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border-2" asChild>
                <Link to="/login">
                  <Lock className="mr-2 h-5 w-5" />
                  Войти в систему
                </Link>
              </Button>
            </div>
            
            <p className="mt-6 text-sm text-foreground/60">
              Нужна помощь? <Link to="/contact" className="text-primary hover:underline">Свяжитесь с нами</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestrictedAccessNotice;
