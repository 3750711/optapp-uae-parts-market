import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import MessageRecipientSelection from '@/components/admin/messages/MessageRecipientSelection';
import MessageComposer from '@/components/admin/messages/MessageComposer';
import MessageHistory from '@/components/admin/messages/MessageHistory';

const AdminMessages = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader title="Сообщения пользователям" />
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Message Creation */}
          <div className="space-y-6">
            <MessageRecipientSelection />
            <MessageComposer />
          </div>
          
          {/* Right Column - Message History */}
          <div>
            <MessageHistory />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;