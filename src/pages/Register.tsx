
import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Register = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
            <CardDescription>
              Создайте аккаунт для использования платформы
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя и фамилия</Label>
              <Input id="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="example@mail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" type="tel" placeholder="+971 XX XXX XXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Повторите пароль</Label>
              <Input id="confirm-password" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label>Тип аккаунта</Label>
              <RadioGroup defaultValue="buyer" className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <RadioGroupItem value="buyer" id="buyer" className="peer sr-only" />
                  <Label
                    htmlFor="buyer"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-optapp-yellow [&:has([data-state=checked])]:border-optapp-yellow cursor-pointer"
                  >
                    <span>Покупатель</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="seller" id="seller" className="peer sr-only" />
                  <Label
                    htmlFor="seller"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-optapp-yellow [&:has([data-state=checked])]:border-optapp-yellow cursor-pointer"
                  >
                    <span>Продавец</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
              Зарегистрироваться
            </Button>
            <div className="text-center text-sm">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-optapp-dark font-medium hover:underline">
                Войти
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
