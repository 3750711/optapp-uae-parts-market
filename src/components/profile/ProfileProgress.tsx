
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Target } from 'lucide-react';
import { ProfileType } from './types';

interface ProfileProgressProps {
  profile: ProfileType;
}

const ProfileProgress: React.FC<ProfileProgressProps> = ({ profile }) => {
  const calculateProgress = () => {
    const fields = [
      { name: 'Имя', value: profile.full_name, weight: 15 },
      { name: 'Телефон', value: profile.phone, weight: 15 },
      { name: 'Telegram', value: profile.telegram, weight: 20 },
      { name: 'OPT ID', value: profile.opt_id, weight: 25 },
      { name: 'Название компании', value: profile.company_name, weight: 15 },
      { name: 'Описание', value: profile.description_user, weight: 10 }
    ];

    let totalProgress = 0;
    const missingFields = [];
    const completedFields = [];

    fields.forEach(field => {
      if (field.value && field.value.trim() !== '') {
        totalProgress += field.weight;
        completedFields.push(field.name);
      } else {
        missingFields.push(field.name);
      }
    });

    return { totalProgress, missingFields, completedFields };
  };

  const { totalProgress, missingFields, completedFields } = calculateProgress();

  const getProgressColor = () => {
    if (totalProgress >= 80) return 'bg-green-500';
    if (totalProgress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressMessage = () => {
    if (totalProgress >= 90) return 'Отличная работа! Ваш профиль почти полностью заполнен.';
    if (totalProgress >= 70) return 'Хорошо! Заполните еще несколько полей для лучшего результата.';
    if (totalProgress >= 50) return 'Неплохое начало! Добавьте больше информации о себе.';
    return 'Заполните профиль для лучшего взаимодействия с пользователями.';
  };

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-optapp-yellow" />
          <CardTitle className="text-lg font-semibold">Заполненность профиля</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Прогресс</span>
            <span className="text-sm font-bold">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-3" />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-700">{getProgressMessage()}</p>
          
          {completedFields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Заполнено
              </h4>
              <div className="flex flex-wrap gap-1">
                {completedFields.map((field, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {missingFields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Рекомендуется заполнить
              </h4>
              <div className="flex flex-wrap gap-1">
                {missingFields.map((field, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileProgress;
