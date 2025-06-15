
import { useEffect, useState, useCallback } from 'react';
import { UseFormReturn, FieldValues, FieldPath } from 'react-hook-form';
import debounce from 'lodash.debounce';

interface ValidationRule<T extends FieldValues> {
  field: FieldPath<T>;
  validator: (value: any, formData: T) => string | null;
  dependencies?: FieldPath<T>[];
}

interface ValidationState {
  [field: string]: {
    isValid: boolean;
    error: string | null;
    isValidating: boolean;
  };
}

export const useRealTimeValidation = <T extends FieldValues>(
  form: UseFormReturn<T>,
  rules: ValidationRule<T>[],
  delay: number = 500
) => {
  const [validationState, setValidationState] = useState<ValidationState>({});
  
  const debouncedValidate = useCallback(
    debounce(async (fieldName: FieldPath<T>, value: any, formData: T) => {
      const rule = rules.find(r => r.field === fieldName);
      if (!rule) return;

      setValidationState(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], isValidating: true }
      }));

      try {
        const error = await rule.validator(value, formData);
        
        setValidationState(prev => ({
          ...prev,
          [fieldName]: {
            isValid: !error,
            error,
            isValidating: false
          }
        }));

        if (error) {
          form.setError(fieldName, { message: error });
        } else {
          form.clearErrors(fieldName);
        }
      } catch (err) {
        setValidationState(prev => ({
          ...prev,
          [fieldName]: {
            isValid: false,
            error: 'Ошибка валидации',
            isValidating: false
          }
        }));
      }
    }, delay),
    [rules, form, delay]
  );

  const validateField = useCallback((fieldName: FieldPath<T>) => {
    const value = form.getValues(fieldName);
    const formData = form.getValues();
    debouncedValidate(fieldName, value, formData);
  }, [form, debouncedValidate]);

  const validateDependentFields = useCallback((changedField: FieldPath<T>) => {
    rules.forEach(rule => {
      if (rule.dependencies?.includes(changedField)) {
        validateField(rule.field);
      }
    });
  }, [rules, validateField]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name) {
        validateField(name as FieldPath<T>);
        validateDependentFields(name as FieldPath<T>);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, validateField, validateDependentFields]);

  return {
    validationState,
    validateField,
    isFieldValid: (field: FieldPath<T>) => validationState[field]?.isValid ?? true,
    getFieldError: (field: FieldPath<T>) => validationState[field]?.error,
    isFieldValidating: (field: FieldPath<T>) => validationState[field]?.isValidating ?? false,
  };
};
