
import React from "react";
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/product/ProductGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

// Mock catalog data
const catalogProducts = [
  {
    id: "1",
    name: "Передний бампер BMW X5",
    price: 2500,
    image: "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=500&auto=format&fit=crop",
    condition: "Новый" as const,
    location: "Дубай"
  },
  {
    id: "2",
    name: "Двигатель Toyota Camry 2.5",
    price: 12000,
    image: "https://images.unsplash.com/photo-1579033014049-f33d9b13a1ce?q=80&w=500&auto=format&fit=crop",
    condition: "Восстановленный" as const,
    location: "Шарджа"
  },
  {
    id: "3",
    name: "Колесные диски R18 Mercedes",
    price: 3200,
    image: "https://images.unsplash.com/photo-1611921059263-39188082fb82?q=80&w=500&auto=format&fit=crop",
    condition: "Новый" as const,
    location: "Абу-Даби"
  },
  {
    id: "4",
    name: "Фары Lexus RX",
    price: 1800,
    image: "https://images.unsplash.com/photo-1582639510494-c80b5de9f148?q=80&w=500&auto=format&fit=crop",
    condition: "Б/У" as const,
    location: "Дубай"
  },
  {
    id: "5",
    name: "Задний бампер Nissan Patrol",
    price: 3500,
    image: "https://images.unsplash.com/photo-1596198222609-0360d4f865b8?q=80&w=500&auto=format&fit=crop",
    condition: "Новый" as const,
    location: "Дубай"
  },
  {
    id: "6",
    name: "Радиатор Honda Accord",
    price: 850,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=500&auto=format&fit=crop",
    condition: "Новый" as const,
    location: "Шарджа"
  },
  {
    id: "7",
    name: "АКПП Land Cruiser 200",
    price: 15000,
    image: "https://images.unsplash.com/photo-1535648451240-482a0bbd6e02?q=80&w=500&auto=format&fit=crop",
    condition: "Б/У" as const,
    location: "Абу-Даби"
  },
  {
    id: "8",
    name: "Комплект тормозных дисков BMW",
    price: 1200,
    image: "https://images.unsplash.com/photo-1547038577-da80abbc4f19?q=80&w=500&auto=format&fit=crop",
    condition: "Новый" as const,
    location: "Дубай"
  },
];

const Catalog = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Каталог автозапчастей</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input type="text" placeholder="Поиск по названию..." className="flex-grow" />
            <Button type="submit" className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
              <Search className="h-4 w-4 mr-2" /> Найти
            </Button>
          </div>
        </div>
        
        {/* Products Grid */}
        <ProductGrid products={catalogProducts} />
        
        {/* Pagination Placeholder */}
        <div className="flex justify-center mt-12">
          <nav>
            <ul className="flex space-x-2">
              <li>
                <Button variant="outline" size="sm" className="text-optapp-dark" disabled>
                  Предыдущая
                </Button>
              </li>
              <li>
                <Button variant="outline" size="sm" className="bg-optapp-yellow text-optapp-dark border-optapp-yellow">
                  1
                </Button>
              </li>
              <li>
                <Button variant="outline" size="sm" className="text-optapp-dark">
                  2
                </Button>
              </li>
              <li>
                <Button variant="outline" size="sm" className="text-optapp-dark">
                  3
                </Button>
              </li>
              <li>
                <Button variant="outline" size="sm" className="text-optapp-dark">
                  Следующая
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </Layout>
  );
};

export default Catalog;
