
import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, ShoppingBag, Award, Send } from "lucide-react";
import { Link } from "react-router-dom";

const RequestPartsPromo = React.memo(() => (
  <div className="relative overflow-hidden rounded-xl mb-8 p-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-fade-in">
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
    
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Не можете найти нужную запчасть?</h2>
        <div className="text-white/90 max-w-2xl space-y-3">
          <p className="text-lg font-medium leading-relaxed animate-fade-in" style={{animationDelay: '100ms'}}>
            <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent font-semibold">Оставьте запрос и получите предложения от 100+ продавцов</span> — быстро и без лишних усилий!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Clock className="h-4 w-4 text-amber-200" />
              </div>
              <p className="text-sm">Предложения в течение минут</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <ShoppingBag className="h-4 w-4 text-amber-200" />
              </div>
              <p className="text-sm">Огромный выбор запчастей</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Award className="h-4 w-4 text-amber-200" />
              </div>
              <p className="text-sm">Лучшие цены на partsbay.ae</p>
            </div>
          </div>
        </div>
      </div>
      
      <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg" asChild>
        <Link to="/requests/create">
          <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
          <Send className="mr-2 h-4 w-4" />
          Оставить запрос
        </Link>
      </Button>
    </div>
  </div>
));

export default RequestPartsPromo;
