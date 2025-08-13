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
      case 'set_active': return 'bg-blue-100 text-blue-800';
      case 'set_role': return 'bg-purple-100 text-purple-800';
      case 'delete_user': return 'bg-red-100 text-red-800';
      case 'approve_request': return 'bg-green-100 text-green-800';
      case 'reject_request': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Historique des Actions Admin
        </Text>
        <Text className="text-gray-600 mt-1">
            {logs.length} action{logs.length !== 1 ? 's' : ''} enregistrée{logs.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Liste des logs */}
        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {logs.map((log) => (
            <View
              key={log.id}
              className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
            >
              <View className="flex-row items-start">
                {/* Icône et action */}
                {/* <View className="mr-3">
                  <Text className="text-2xl">{getActionIcon(log.action)}</Text>
                </View> */}

                <View className="flex-1">
                  {/* Header de l'action */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className={`px-2 py-1 rounded-full ${getActionColor(log.action)}`}>
                      <Text className="text-xs font-medium">
                        {getActionText(log.action)}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      ID #{log.id}
                    </Text>
                  </View>

                  {/* Détails */}
                  <View className="space-y-1">
                    <Text className="text-gray-700">
                      <Text className="font-medium">Admin:</Text> ID {log.admin_id}
                    </Text>
                    
                    {log.target_user_id && (
                      <Text className="text-gray-700">
                        <Text className="font-medium">Utilisateur cible:</Text> ID {log.target_user_id}
                      </Text>
                    )}
                    
                    {log.details && (
                      <Text className="text-gray-700">
                        <Text className="font-medium">Détails:</Text> {log.details}
                      </Text>
                    )}
                    
                    <Text className="text-gray-500 text-sm mt-2">
                      {formatDate(log.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {logs.length === 0 && (
            <View className="bg-white rounded-lg p-8 items-center">
              <Text className="text-gray-500 text-lg">Aucune action enregistrée</Text>
              <Text className="text-gray-400 mt-2 text-center">
                Les actions administratives apparaîtront ici
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
  );
};

export default AdminActionLogs;
