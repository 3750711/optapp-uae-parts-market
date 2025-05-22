
# Telegram Notification Function

## ⚠️ IMPORTANT: CRITICAL SYSTEM

This edge function handles sending notifications to Telegram for:
1. Order creation events
2. Product status changes (including "sold" notifications)

## Current Status

- **Working**: Yes
- **Last Verified**: 2025-05-22
- **Version**: 1.0.0

## Modification Policy

**DO NOT MODIFY** these files unless absolutely necessary. The notification system is critical for business operations and has been carefully tuned to work correctly.

If changes are needed:
1. Create a backup of all files
2. Document the reason for changes
3. Test thoroughly in a development environment before deploying
4. Update version numbers and verification dates in file headers

## Files

- `index.ts`: Main entry point that routes requests to appropriate handlers
- `order-notification.ts`: Processes order notifications (CRITICAL)
- `product-notification.ts`: Processes product notifications (CRITICAL)
- `telegram-api.ts`: Helper functions for Telegram API interactions
- `config.ts`: Configuration values and constants

## Database Integration

This function works in conjunction with database triggers:
- `notify_on_product_status_changes`: Triggers notifications when product status changes
- `notify_on_order_product_status_changes`: Triggers notifications when orders change product status

Any changes to these database functions must be synchronized with changes to this edge function.
