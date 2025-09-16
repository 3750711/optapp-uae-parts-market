
import { z } from "zod";

export const adminProductSchema = z.object({
  title: z.string().min(3, { message: "Название должно содержать не менее 3 символов" }),
  price: z.string().min(1, { message: "Укажите цену товара" }).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Цена должна быть нулем или положительным целым числом" }),
  brandId: z.string().min(1, { message: "Выберите марку автомобиля" }),
  modelId: z.string().optional(),
  placeNumber: z.string().min(1, { message: "Укажите количество мест" }).refine((val) => !isNaN(Number(val)) && Number.isInteger(Number(val)) && Number(val) > 0, { message: "Количество мест должно быть целым положительным числом" }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === "" || !isNaN(Number(val)), { message: "Стоимость доставки должна быть числом" }),
  sellerId: z.string().min(1, { message: "Выберите продавца" }),
});

export type AdminProductFormValues = z.infer<typeof adminProductSchema>;
