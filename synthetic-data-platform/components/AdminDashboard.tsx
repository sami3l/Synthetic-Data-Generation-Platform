import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AdminHome from './AdminHome';
import UserManagement from './UserManagement';
import RequestManagement from './RequestManagement';
import AdminActionLogs from './AdminActionLogs';
import AdminAnalytics from './AdminAnalytics';

type TabType = 'home' | 'users' | 'requests' | 'analytics' | 'logs';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const tabs = [
    {
      id: 'home' as TabType,
      title: 'Accueil',
      icon: '🏠',
      description: 'Vue d\'ensemble'
    },
    {
      id: 'users' as TabType,
      title: 'Utilisateurs',
      icon: '👥',
      description: 'Gérer les utilisateurs'
    },
    {
      id: 'requests' as TabType,
      title: 'Requêtes',
      icon: '📋',
      description: 'Approuver/Rejeter'
    },
    {
      id: 'logs' as TabType,
      title: 'Logs',
      icon: '📝',
      description: 'Historique des actions'
    },
    // {
    //   id: 'analytics' as TabType,
    //   title: 'Analytics',
    //   icon: '📊',
    //   description: 'Statistiques détaillées'
    // },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminHome />;
      case 'users':
        return <UserManagement />;
      case 'requests':
        return <RequestManagement />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'logs':
        return <AdminActionLogs />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header principal */}
      <View className="bg-transparent border-gray-200">
        <View className="p-4 pb-2">
          {/* <Text className="text-3xl font-bold text-gray-900">
            🛠️ Administration
          </Text> */}
          
        </View>

        {/* Onglets */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 web:justify-center "
        >
          <View className="flex-row space-x-2 pb-4">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full border ${
                  activeTab === tab.id
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className="text-lg mr-2">{tab.icon}</Text>
                  <View>
                    <Text className={`font-semibold ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-700'
                    }`}>
                      {tab.title}
                    </Text>
                    {/* <Text className={`text-xs ${
                      activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {tab.description}
                    </Text> */}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Contenu de l'onglet actif */}
      <View className="flex-1">
        {renderContent()}
      </View>
    </View>
  );
};

export default AdminDashboard;
