import { QueueMonitor } from '@/components/admin/notifications/QueueMonitor';

export default function AdminNotifications() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <QueueMonitor />
    </div>
  );
}
