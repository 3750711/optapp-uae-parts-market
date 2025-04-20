
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Добро пожаловать в OPTAPP</h1>
        <p className="text-xl text-gray-600 mb-8">Платформа для оптовой торговли</p>
        
        <div className="flex justify-center space-x-4">
          <Link to="/catalog">
            <Button variant="default">
              Перейти в каталог <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Link to="/admin">
            <Button variant="secondary">
              Панель администратора <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
