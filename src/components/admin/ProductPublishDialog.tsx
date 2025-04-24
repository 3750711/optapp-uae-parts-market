import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const formSchema = z.object({
  delivery_price: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Стоимость доставки должна быть неотрицательным числом" }
  ),
});

interface ProductPublishDialogProps {
  product: Product;
  trigger: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const ProductPublishDialog = ({
  product,
  trigger,
  onSuccess,
  open,
  setOpen,
}: ProductPublishDialogProps) => {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = setOpen || setInternalOpen;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      delivery_price: product.delivery_price?.toString() || "0",
    },
  });

  const deliveryPriceGuide = `
ДВС без КПП малый, 4-цилиндровый, без навесного - $164
ДВС без КПП малый, 4-цилиндровый - $184
ДВС+КПП малый, 4-цилиндровый - $222
ДВС без КПП 4-цилиндровый (тип N20) - $250
ДВС без КПП средний, 6-цилиндровый - $250
ДВС+КПП средний, 6-цилиндровый, маленькая коробка (тип 1MZ, G6BA, VQ35) - $300
ДВС+КПП средний, 6-цилиндровый (тип BMW, Mercedes) - $333
ДВС+КПП большой, 8-цилиндровый (тип VK56, 1GR, 2UZ) - $333
ДВС+КПП большой, 8-цилиндровый (тип VK56, 1GR, 2UZ) - $400
Nose cut (Ноускат) низкий - $202
Nose cut (Ноускат) высокий - $260
АКПП/МКПП - $90
Балка/подрамник - $27
Бампер/Крышка багажника - $27
Радиатор - $27
Редуктор - $27
Крылья малые (пара) - $35
Крылья большие (пара) - $54
Капот - $41
Кассета радиаторов - $45
Дверь багажника/боковая - $90
Мелочь (1 место) - $12`;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase
      .from('products')
      .update({
        status: 'active',
        delivery_price: parseFloat(values.delivery_price),
      })
      .eq('id', product.id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось опубликовать товар",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успех",
        description: "Товар успешно опубликован",
      });
      handleOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Опубликовать товар</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mb-4 overflow-y-auto">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Название</h4>
            <p className="text-sm">{product.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Марка</h4>
              <p className="text-sm">{product.brand}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Модель</h4>
              <p className="text-sm">{product.model}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="delivery_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Стоимость доставки ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit">
                Опубликовать
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-4 border-t pt-4">
          <Collapsible
            open={isGuideOpen}
            onOpenChange={setIsGuideOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full justify-between p-0 font-medium"
              >
                <span>Справочник стоимости доставки</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isGuideOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="mt-2 max-h-[300px]">
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {deliveryPriceGuide}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
};
