
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  required: boolean;
  filled: boolean;
  hasError?: boolean;
}

interface FormProgressIndicatorProps {
  fields: FormField[];
  className?: string;
}

const FormProgressIndicator: React.FC<FormProgressIndicatorProps> = ({ fields, className }) => {
  const requiredFields = fields.filter(field => field.required);
  const filledRequiredFields = requiredFields.filter(field => field.filled);
  const progressPercentage = (filledRequiredFields.length / requiredFields.length) * 100;
  
  const totalFilled = fields.filter(field => field.filled).length;
  const fieldsWithErrors = fields.filter(field => field.hasError).length;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Прогресс заполнения</h3>
        <span className="text-sm text-muted-foreground">
          {filledRequiredFields.length}/{requiredFields.length} обязательных
        </span>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="grid grid-cols-1 gap-2">
        {fields.map((field) => (
          <div key={field.name} className="flex items-center gap-2 text-sm">
            {field.hasError ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : field.filled ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`${field.required ? 'font-medium' : ''} ${field.hasError ? 'text-destructive' : field.filled ? 'text-green-600' : 'text-muted-foreground'}`}>
              {field.label} {field.required && '*'}
            </span>
          </div>
        ))}
      </div>
      
      {fieldsWithErrors > 0 && (
        <div className="text-sm text-destructive font-medium">
          {fieldsWithErrors} ошибок в форме
        </div>
      )}
    </div>
  );
};

export default FormProgressIndicator;
