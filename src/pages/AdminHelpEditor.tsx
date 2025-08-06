import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle, 
  User, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Settings,
  GripVertical
} from 'lucide-react';
import { useHelpData, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateHelpItem, useUpdateHelpItem, useDeleteHelpItem } from '@/hooks/useHelpData';
import { useForm } from 'react-hook-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const iconOptions = [
  { value: 'HelpCircle', label: 'Помощь', icon: HelpCircle },
  { value: 'User', label: 'Пользователь', icon: User },
  { value: 'ShoppingCart', label: 'Корзина', icon: ShoppingCart },
  { value: 'Package', label: 'Пакет', icon: Package },
  { value: 'CreditCard', label: 'Карта', icon: CreditCard },
  { value: 'Settings', label: 'Настройки', icon: Settings },
];

interface CategoryFormData {
  title: string;
  icon_name: string;
  order_index: number;
}

interface HelpItemFormData {
  question: string;
  answer: string;
  category_id: string;
  order_index: number;
}

const AdminHelpEditor = () => {
  const { data: helpData, isLoading } = useHelpData();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createHelpItem = useCreateHelpItem();
  const updateHelpItem = useUpdateHelpItem();
  const deleteHelpItem = useDeleteHelpItem();

  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);

  const categoryForm = useForm<CategoryFormData>();
  const itemForm = useForm<HelpItemFormData>();

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(opt => opt.value === iconName);
    return option ? option.icon : HelpCircle;
  };

  const handleCreateCategory = (data: CategoryFormData) => {
    createCategory.mutate(data, {
      onSuccess: () => {
        setShowCategoryDialog(false);
        categoryForm.reset();
      }
    });
  };

  const handleUpdateCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...data }, {
        onSuccess: () => {
          setEditingCategory(null);
          setShowCategoryDialog(false);
          categoryForm.reset();
        }
      });
    }
  };

  const handleCreateItem = (data: HelpItemFormData) => {
    createHelpItem.mutate(data, {
      onSuccess: () => {
        setShowItemDialog(false);
        itemForm.reset();
      }
    });
  };

  const handleUpdateItem = (data: HelpItemFormData) => {
    if (editingItem) {
      updateHelpItem.mutate({ id: editingItem.id, ...data }, {
        onSuccess: () => {
          setEditingItem(null);
          setShowItemDialog(false);
          itemForm.reset();
        }
      });
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    categoryForm.reset({
      title: category.title,
      icon_name: category.icon_name,
      order_index: category.order_index
    });
    setShowCategoryDialog(true);
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    itemForm.reset({
      question: item.question,
      answer: item.answer,
      category_id: item.category_id,
      order_index: item.order_index
    });
    setShowItemDialog(true);
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
      title: '',
      icon_name: 'HelpCircle',
      order_index: (helpData?.length || 0) + 1
    });
    setShowCategoryDialog(true);
  };

  const openNewItem = (categoryId?: string) => {
    setEditingItem(null);
    const category = helpData?.find(c => c.id === categoryId);
    itemForm.reset({
      question: '',
      answer: '',
      category_id: categoryId || '',
      order_index: (category?.help_items?.length || 0) + 1
    });
    setShowItemDialog(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Загрузка...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader title="Редактор страницы помощи" />
        
        {/* Categories Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Управление категориями FAQ
            </CardTitle>
            <Button onClick={openNewCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить категорию
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {helpData?.map((category) => {
                const IconComponent = getIconComponent(category.icon_name);
                return (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <IconComponent className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">{category.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Порядок: {category.order_index} • Вопросов: {category.help_items?.length || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditCategory(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить. Все вопросы в этой категории также будут удалены.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCategory.mutate(category.id)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {/* Help Items in Category */}
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Вопросы в категории</h4>
                        <Button variant="ghost" size="sm" onClick={() => openNewItem(category.id)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Добавить вопрос
                        </Button>
                      </div>
                      {category.help_items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.question}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.answer}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Badge variant="secondary" className="text-xs">{item.order_index}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => openEditItem(item)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить вопрос?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteHelpItem.mutate(item.id)}>
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={categoryForm.handleSubmit(editingCategory ? handleUpdateCategory : handleCreateCategory)} className="space-y-4">
              <div>
                <Label htmlFor="title">Название категории</Label>
                <Input 
                  id="title" 
                  {...categoryForm.register('title', { required: true })}
                  placeholder="Введите название категории"
                />
              </div>
              
              <div>
                <Label htmlFor="icon_name">Иконка</Label>
                <Select 
                  value={categoryForm.watch('icon_name')} 
                  onValueChange={(value) => categoryForm.setValue('icon_name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите иконку" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order_index">Порядок отображения</Label>
                <Input 
                  id="order_index" 
                  type="number"
                  {...categoryForm.register('order_index', { required: true, valueAsNumber: true })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {editingCategory ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Help Item Dialog */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Редактировать вопрос' : 'Новый вопрос'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={itemForm.handleSubmit(editingItem ? handleUpdateItem : handleCreateItem)} className="space-y-4">
              <div>
                <Label htmlFor="category_id">Категория</Label>
                <Select 
                  value={itemForm.watch('category_id')} 
                  onValueChange={(value) => itemForm.setValue('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {helpData?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question">Вопрос</Label>
                <Input 
                  id="question" 
                  {...itemForm.register('question', { required: true })}
                  placeholder="Введите вопрос"
                />
              </div>
              
              <div>
                <Label htmlFor="answer">Ответ</Label>
                <Textarea 
                  id="answer" 
                  {...itemForm.register('answer', { required: true })}
                  placeholder="Введите ответ"
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="order_index">Порядок отображения</Label>
                <Input 
                  id="order_index" 
                  type="number"
                  {...itemForm.register('order_index', { required: true, valueAsNumber: true })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowItemDialog(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createHelpItem.isPending || updateHelpItem.isPending}>
                  {editingItem ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminHelpEditor;