import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Package, Edit, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useContainers } from '@/hooks/useContainers';
import { Database } from '@/integrations/supabase/types';

type ContainerStatus = Database['public']['Enums']['container_status'];

const getContainerStatusLabel = (status: ContainerStatus): string => {
  const statusLabels: Record<ContainerStatus, string> = {
    'waiting': 'Ожидание',
    'in_transit': 'В пути',
    'delivered': 'Доставлен',
    'lost': 'Потерян',
    'sent_from_uae': 'Отправлен из ОАЭ',
    'transit_iran': 'Транзит Иран',
    'to_kazakhstan': 'Следует в Казахстан',
    'customs': 'Таможня',
    'cleared_customs': 'Вышел с таможни',
    'received': 'Получен'
  };
  return statusLabels[status] || status;
};

const getContainerStatusColor = (status: ContainerStatus): string => {
  const statusColors: Record<ContainerStatus, string> = {
    'waiting': 'bg-yellow-100 text-yellow-800',
    'in_transit': 'bg-blue-100 text-blue-800',
    'delivered': 'bg-green-100 text-green-800',
    'lost': 'bg-red-100 text-red-800',
    'sent_from_uae': 'bg-purple-100 text-purple-800',
    'transit_iran': 'bg-orange-100 text-orange-800',
    'to_kazakhstan': 'bg-indigo-100 text-indigo-800',
    'customs': 'bg-amber-100 text-amber-800',
    'cleared_customs': 'bg-cyan-100 text-cyan-800',
    'received': 'bg-green-100 text-green-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

interface ContainerManagementProps {
  onClose: () => void;
}

export const ContainerManagement: React.FC<ContainerManagementProps> = ({ onClose }) => {
  const {
    containers,
    isLoading,
    searchTerm,
    setSearchTerm,
    createContainer,
    updateContainerStatus,
    deleteContainer,
    isCreating,
    isUpdating,
    isDeleting
  } = useContainers();

  const [newContainer, setNewContainer] = useState({
    container_number: '',
    status: 'waiting' as ContainerStatus,
    description: ''
  });

  const [editingContainer, setEditingContainer] = useState<{
    id: string;
    container_number: string;
    status: ContainerStatus;
  } | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreateContainer = async () => {
    if (!newContainer.container_number.trim()) return;

    try {
      await createContainer.mutateAsync({
        container_number: newContainer.container_number.trim(),
        status: newContainer.status,
        description: newContainer.description.trim() || null
      });

      setNewContainer({
        container_number: '',
        status: 'waiting' as ContainerStatus,
        description: ''
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating container:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingContainer) return;

    try {
      await updateContainerStatus.mutateAsync({
        containerNumber: editingContainer.container_number,
        status: editingContainer.status
      });
      setEditingContainer(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating container status:', error);
    }
  };

  const handleDeleteContainer = async (id: string) => {
    try {
      await deleteContainer.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting container:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Загрузка контейнеров...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Управление контейнерами
            </CardTitle>
            <CardDescription>
              Централизованное управление всеми контейнерами и их статусами
            </CardDescription>
          </div>
          <Button onClick={onClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Add Container */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Поиск по номеру контейнера или описанию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить контейнер
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новый контейнер</DialogTitle>
                <DialogDescription>
                  Добавьте новый контейнер для отслеживания статуса отгрузок
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="container_number">Номер контейнера *</Label>
                  <Input
                    id="container_number"
                    value={newContainer.container_number}
                    onChange={(e) => setNewContainer({ ...newContainer, container_number: e.target.value })}
                    placeholder="Введите номер контейнера"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Начальный статус</Label>
                  <Select
                    value={newContainer.status}
                    onValueChange={(value: ContainerStatus) => setNewContainer({ ...newContainer, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiting">Ожидание</SelectItem>
                      <SelectItem value="sent_from_uae">Отправлен из ОАЭ</SelectItem>
                      <SelectItem value="transit_iran">Транзит Иран</SelectItem>
                      <SelectItem value="to_kazakhstan">Следует в Казахстан</SelectItem>
                      <SelectItem value="customs">Таможня</SelectItem>
                      <SelectItem value="cleared_customs">Вышел с таможни</SelectItem>
                      <SelectItem value="in_transit">В пути</SelectItem>
                      <SelectItem value="delivered">Доставлен</SelectItem>
                      <SelectItem value="received">Получен</SelectItem>
                      <SelectItem value="lost">Потерян</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={newContainer.description}
                    onChange={(e) => setNewContainer({ ...newContainer, description: e.target.value })}
                    placeholder="Дополнительная информация о контейнере"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleCreateContainer}
                  disabled={!newContainer.container_number.trim() || isCreating}
                >
                  {isCreating ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* Containers List */}
        <div className="space-y-4">
          {containers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Контейнеры не найдены' : 'Контейнеры пока не добавлены'}
            </div>
          ) : (
            containers.map((container) => (
              <Card key={container.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{container.container_number}</span>
                    </div>
                    
                    <Badge className={getContainerStatusColor(container.status)}>
                      {getContainerStatusLabel(container.status)}
                    </Badge>
                    
                    {container.description && (
                      <span className="text-sm text-muted-foreground">
                        {container.description}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingContainer({
                            id: container.id,
                            container_number: container.container_number,
                            status: container.status
                          })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Изменить статус контейнера</DialogTitle>
                          <DialogDescription>
                            Изменение статуса автоматически обновит все связанные заказы
                          </DialogDescription>
                        </DialogHeader>
                        
                        {editingContainer && (
                          <div className="space-y-4">
                            <div>
                              <Label>Номер контейнера</Label>
                              <Input value={editingContainer.container_number} disabled />
                            </div>
                            
                            <div>
                              <Label htmlFor="edit_status">Новый статус</Label>
                              <Select
                                value={editingContainer.status}
                                onValueChange={(value: ContainerStatus) => 
                                  setEditingContainer({ ...editingContainer, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="waiting">Ожидание</SelectItem>
                                  <SelectItem value="sent_from_uae">Отправлен из ОАЭ</SelectItem>
                                  <SelectItem value="transit_iran">Транзит Иран</SelectItem>
                                  <SelectItem value="to_kazakhstan">Следует в Казахстан</SelectItem>
                                  <SelectItem value="customs">Таможня</SelectItem>
                                  <SelectItem value="cleared_customs">Вышел с таможни</SelectItem>
                                  <SelectItem value="in_transit">В пути</SelectItem>
                                  <SelectItem value="delivered">Доставлен</SelectItem>
                                  <SelectItem value="received">Получен</SelectItem>
                                  <SelectItem value="lost">Потерян</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-6">
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Отмена
                          </Button>
                          <Button 
                            onClick={handleUpdateStatus}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Обновление...' : 'Обновить статус'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить контейнер?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Контейнер будет удален навсегда.
                            Убедитесь, что к нему не привязаны активные заказы.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteContainer(container.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Удаление...' : 'Удалить'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};