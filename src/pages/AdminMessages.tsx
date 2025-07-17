import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import MessageRecipientSelection from '@/components/admin/messages/MessageRecipientSelection';
import MessageComposer from '@/components/admin/messages/MessageComposer';
import MessageHistory from '@/components/admin/messages/MessageHistory';
import { useRecipientSelection } from '@/hooks/useRecipientSelection';
import { useNewMessageHistory } from '@/hooks/useNewMessageHistory';

const AdminMessages = () => {
  const recipientSelection = useRecipientSelection();
  const { refreshHistory } = useNewMessageHistory();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader title="Сообщения пользователям" />
        
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
          {/* Left Column - Message Creation */}
          <div className="space-y-4 lg:space-y-6 order-1">
            <MessageRecipientSelection {...recipientSelection} />
            <MessageComposer 
              selectedRecipients={recipientSelection.selectedRecipients}
              selectedGroup={recipientSelection.selectedGroup}
              getSelectionSummary={recipientSelection.getSelectionSummary}
              refreshHistory={refreshHistory}
            />
          </div>
          
          {/* Right Column - Message History */}
          <div className="order-2 lg:order-none">
            <MessageHistory />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;