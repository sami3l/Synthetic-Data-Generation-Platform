import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { adminService, AdminActionLog } from '../services/api/adminService';

const AdminActionLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const data = await adminService.getAdminActionLogs(0, 100);
      setLogs(data);
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'set_active': return 'bg-blue-50 border-blue-200';
      case 'set_role': return 'bg-purple-50 border-purple-200';
      case 'delete_user': return 'bg-red-50 border-red-200';
      case 'approve_request': return 'bg-green-50 border-green-200';
      case 'reject_request': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'set_active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'set_role': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delete_user': return 'bg-red-100 text-red-700 border-red-200';
      case 'approve_request': return 'bg-green-100 text-green-700 border-green-200';
      case 'reject_request': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'set_active': return 'Modification statut';
      case 'set_role': return 'Modification rôle';
      case 'delete_user': return 'Suppression utilisateur';
      case 'approve_request': return 'Approbation requête';
      case 'reject_request': return 'Rejet requête';
      default: return action;
    }
  };

  // const getActionIcon = (action: string) => {
  //   switch (action) {
  //     case 'set_active': return '🔄';
  //     case 'set_role': return '👤';
  //     case 'delete_user': return '🗑️';
  //     case 'approve_request': return '✅';
  //     case 'reject_request': return '❌';
  //     default: return '📝';
  //   }
  // };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'set_active': return '🔄';
      case 'set_role': return '👤';
      case 'delete_user': return '🗑️';
      case 'approve_request': return '✅';
      case 'reject_request': return '❌';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `Il y a ${minutes} min`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Il y a ${hours}h`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Chargement des logs...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 web:w-1/2 web:bg-transparent web:max-w-full web:self-center">
      {/* Header moderne */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <Text className="text-3xl font-bold text-gray-900 tracking-tight">
          Historique des Actions
        </Text>
        <View className="flex-row items-center mt-2">
          <View className="w-2 h-2 bg-green-500 rounded-full mr-2"></View>
          <Text className="text-gray-600 font-medium">
            {logs.length} action{logs.length !== 1 ? 's' : ''} enregistrée{logs.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

        {/* Liste des logs moderne */}
        <ScrollView
          className="flex-1 px-4 py-2"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {logs.map((log, index) => (
            <View
              key={log.id}
              className={`bg-white rounded-xl mb-3 border shadow-sm ${getActionColor(log.action)}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              {/* Timeline indicator */}
              {index !== logs.length - 1 && (
                <View className="absolute left-8 top-16 w-0.5 h-8 bg-gray-200 z-0" />
              )}
              
              <View className="p-5">
                <View className="flex-row items-start">
                  {/* Icône avec timeline */}
                  <View className="mr-4 items-center">
                    <View className="w-10 h-10 bg-white rounded-full border-2 border-gray-200 items-center justify-center shadow-sm">
                      <Text className="text-lg">{getActionIcon(log.action)}</Text>
                    </View>
                  </View>

                  <View className="flex-1">
                    {/* Header de l'action moderne */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className={`px-3 py-1 rounded-full border ${getActionBadgeColor(log.action)}`}>
                        <Text className="text-sm font-semibold">
                          {getActionText(log.action)}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400 font-medium">
                        #{log.id}
                      </Text>
                    </View>

                    {/* Détails avec meilleure hiérarchie */}
                    <View className="space-y-2">
                      <View className="flex-row items-center">
                        <Text className="text-base font-medium text-gray-600 w-20">Admin :</Text>
                        <Text className="text-sm text-green-500 font-semibold flex-1">
                          {log.admin_username}
                        </Text>
                      </View>

                      {log.target_user_id && (
                        <View className="flex-row items-center">
                          <Text className="text-base font-medium text-gray-600 w-20">Cible :</Text>
                          <Text className="text-sm text-gray-900 flex-1">
                            Utilisateur #{log.target_user_id}
                          </Text>
                        </View>
                      )}
                      
                      {log.details && (
                        <View className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <Text className="text-xs font-medium text-gray-500 mb-1">DÉTAILS :</Text>
                          <Text className="text-sm text-gray-700 leading-relaxed">
                            {log.details }
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Timestamp moderne */}
                    <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100">
                      <View className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                      <Text className="text-xs text-gray-500 font-medium">
                        {formatDate(log.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {logs.length === 0 && (
            <View className="bg-white rounded-xl p-12 items-center mx-2 mt-8 shadow-sm border border-gray-100">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Text className="text-2xl">📋</Text>
              </View>
              <Text className="text-gray-600 text-lg font-semibold mb-2">
                Aucune action enregistrée
              </Text>
              <Text className="text-gray-400 text-center leading-relaxed">
                Les actions administratives{'\n'}apparaîtront ici
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
  );
};

export default AdminActionLogs;
