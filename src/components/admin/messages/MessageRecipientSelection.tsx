import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Search, UserCheck, UserX, Shield, Star } from 'lucide-react';
import { useRecipientSelection } from '@/hooks/useRecipientSelection';

const MessageRecipientSelection = () => {
  const {
    selectedRecipients,
    searchQuery,
    searchResults,
    isSearching,
    predefinedGroups,
    selectedGroup,
    setSearchQuery,
    selectUser,
    deselectUser,
    selectGroup,
    clearSelection,
    getSelectionSummary
  } = useRecipientSelection();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsExpanded(query.length > 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Выбор получателей
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Predefined Groups */}
        <div>
          <Label className="text-sm font-medium">Группы пользователей</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {predefinedGroups.map((group) => (
              <Button
                key={group.value}
                variant={selectedGroup === group.value ? "default" : "outline"}
                size="sm"
                onClick={() => selectGroup(group.value)}
                className="justify-start"
              >
                <group.icon className="h-4 w-4 mr-2" />
                {group.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Individual User Search */}
        <div>
          <Label className="text-sm font-medium">Поиск пользователей</Label>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, email или Telegram..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Search Results */}
        {isExpanded && searchQuery && (
          <div className="border rounded-lg">
            <ScrollArea className="h-40">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground">
                  Поиск пользователей...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2 space-y-1">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                    >
                      <Checkbox
                        checked={selectedRecipients.some(r => r.id === user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectUser(user);
                          } else {
                            deselectUser(user.id);
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {user.full_name || user.email}
                          </span>
                          {user.user_type === 'admin' && (
                            <Shield className="h-3 w-3 text-primary" />
                          )}
                          {user.verification_status === 'verified' && (
                            <UserCheck className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.telegram && `@${user.telegram.replace('@', '')}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Пользователи не найдены
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Selected Recipients Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Выбрано получателей:</span>
            <Badge variant="secondary">
              {getSelectionSummary()}
            </Badge>
          </div>
          {(selectedRecipients.length > 0 || selectedGroup) && (
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Очистить
            </Button>
          )}
        </div>

        {/* Individual Selected Users */}
        {selectedRecipients.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Выбранные пользователи</Label>
            <ScrollArea className="h-24 mt-2">
              <div className="flex flex-wrap gap-1">
                {selectedRecipients.map((user) => (
                  <Badge
                    key={user.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => deselectUser(user.id)}
                  >
                    {user.full_name || user.email}
                    <UserX className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageRecipientSelection;