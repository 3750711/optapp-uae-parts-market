import { useMemo } from 'react';

interface SellerContact {
  telegram?: string | null;
  phone?: string | null;
  seller_id?: string;
}

interface ContactValidationResult {
  canContactDirect: boolean;
  availableContacts: ('telegram' | 'whatsapp')[];
  hasValidContacts: boolean;
  fallbackToManager: boolean;
  validationErrors: string[];
}

export const useContactValidation = (
  sellerContact?: SellerContact | null,
  contactType?: 'telegram' | 'whatsapp'
): ContactValidationResult => {
  return useMemo(() => {
    const result: ContactValidationResult = {
      canContactDirect: false,
      availableContacts: [],
      hasValidContacts: false,
      fallbackToManager: false,
      validationErrors: [],
    };

    if (!sellerContact) {
      result.validationErrors.push('Данные продавца недоступны');
      result.fallbackToManager = true;
      return result;
    }

    // Check available contact methods
    const hasTelegram = Boolean(sellerContact.telegram?.trim());
    const hasPhone = Boolean(sellerContact.phone?.trim());

    if (hasTelegram) {
      result.availableContacts.push('telegram');
    }
    if (hasPhone) {
      result.availableContacts.push('whatsapp');
    }

    result.hasValidContacts = result.availableContacts.length > 0;

    // Validate specific contact type
    if (contactType) {
      const contactAvailable = 
        (contactType === 'telegram' && hasTelegram) ||
        (contactType === 'whatsapp' && hasPhone);

      if (!contactAvailable) {
        const missingContact = contactType === 'telegram' ? 'Telegram' : 'WhatsApp';
        result.validationErrors.push(`У продавца нет ${missingContact}`);
        result.fallbackToManager = true;
      } else {
        result.canContactDirect = true;
      }
    } else {
      result.canContactDirect = result.hasValidContacts;
    }

    // If no contacts available, suggest manager
    if (!result.hasValidContacts) {
      result.validationErrors.push('У продавца нет контактной информации');
      result.fallbackToManager = true;
    }

    return result;
  }, [sellerContact, contactType]);
};