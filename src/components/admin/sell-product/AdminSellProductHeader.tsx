
import React from 'react';
import { ShoppingCart, Package, User } from 'lucide-react';

const AdminSellProductHeader: React.FC = () => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Продать товар</h1>
      </div>
      <p className="text-gray-600 text-lg">
        Выберите товар и покупателя для создания заказа от имени администратора
      </p>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Процесс:</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-6 text-sm text-blue-700">
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-xs font-medium">1</span>
                <span>Выбор товара</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-xs font-medium">2</span>
                <span>Выбор покупателя</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-xs font-medium">3</span>
                <span>Создание заказа</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSellProductHeader;
