-- Add missing container statuses to the container_status enum
ALTER TYPE container_status ADD VALUE IF NOT EXISTS 'sent_from_uae';
ALTER TYPE container_status ADD VALUE IF NOT EXISTS 'transit_iran';
ALTER TYPE container_status ADD VALUE IF NOT EXISTS 'to_kazakhstan';
ALTER TYPE container_status ADD VALUE IF NOT EXISTS 'customs';
ALTER TYPE container_status ADD VALUE IF NOT EXISTS 'cleared_customs';
ALTER TYPE container_status ADD VALUE IF NOT EXISTS 'received';