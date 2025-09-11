import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
// import { adminService } from '../services/api/adminService';

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    userGrowth: {
      thisMonth: 12,
      lastMonth: 8,
      percentage: 50
    },
    requestsAnalytics: {
      total: 5,
      approved: 2,
      rejected: 1,
      pending: 2
    },
    systemUsage: {
      activeUsers: 28,
      totalStorage: '2.4 GB',
      avgProcessingTime: '24 min'
    }
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Simulation de chargement des analytics
      // Dans une vraie app, vous feriez des appels API ici
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Erreur', 'Impossible de charger les analyses');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Chargement des analyses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className=" p-6 rounded-b-3xl mb-6">
          <Text className="text-red-700 text-5xl font-bold mb-2">
              TODO
          </Text>
          </View>
          {/* <Text className="text-black text-3xl font-bold mb-2">
            Analyses détaillées
          </Text>
          <Text className="text-black text-lg">
            Statistiques et tendances
          </Text> */}

        {/* User Growth */}
        <View className="px-6 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Croissance des utilisateurs
          </Text>
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-700">
                Nouveaux utilisateurs
              </Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-800 font-medium text-sm">
                  +{analytics.userGrowth.percentage}%
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-3xl font-bold text-blue-600">
                  {analytics.userGrowth.thisMonth}
                </Text>
                <Text className="text-gray-500">Ce mois-ci</Text>
              </View>
              <View className="flex-1">
                <Text className="text-3xl font-bold text-gray-400">
                  {analytics.userGrowth.lastMonth}
                </Text>
                <Text className="text-gray-500">Mois dernier</Text>
              </View>
            </View>

            {/* Graphique simulé */}
            <View className="h-32 bg-gray-50 rounded-lg flex-row items-end justify-around p-4">
              <View className="bg-blue-200 w-8 h-16 rounded-t"></View>
              <View className="bg-blue-300 w-8 h-20 rounded-t"></View>
              <View className="bg-blue-400 w-8 h-12 rounded-t"></View>
              <View className="bg-blue-500 w-8 h-24 rounded-t"></View>
              <View className="bg-blue-600 w-8 h-28 rounded-t"></View>
            </View>
          </View>
        </View>

        {/* Requests Analytics */}
        <View className="px-6 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Analyse des requêtes
          </Text>
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between mb-6">
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {analytics.requestsAnalytics.approved}
                </Text>
                <Text className="text-sm text-gray-500">Approuvées</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {analytics.requestsAnalytics.rejected}
                </Text>
                <Text className="text-sm text-gray-500">Rejetées</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-600">
                  {analytics.requestsAnalytics.pending}
                </Text>
                <Text className="text-sm text-gray-500">En attente</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {analytics.requestsAnalytics.total}
                </Text>
                <Text className="text-sm text-gray-500">Total</Text>
              </View>
            </View>

            {/* Barre de progression */}
            <View className="h-4 bg-gray-200 rounded-full overflow-hidden flex-row">
              <View 
                className="bg-green-500 h-full"
                style={{ 
                  width: `${(analytics.requestsAnalytics.approved / analytics.requestsAnalytics.total) * 100}%` 
                }}
              ></View>
              <View 
                className="bg-red-500 h-full"
                style={{ 
                  width: `${(analytics.requestsAnalytics.rejected / analytics.requestsAnalytics.total) * 100}%` 
                }}
              ></View>
              <View 
                className="bg-orange-500 h-full"
                style={{ 
                  width: `${(analytics.requestsAnalytics.pending / analytics.requestsAnalytics.total) * 100}%` 
                }}
              ></View>
            </View>
            
            <Text className="text-center text-gray-500 text-sm mt-3">
              Répartition des statuts de requêtes
            </Text>
          </View>
        </View>

        {/* System Usage */}
        <View className="px-6 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Utilisation du système
          </Text>
          <View className="space-y-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-xl">👤</Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold">
                      Utilisateurs actifs
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Dernières 24h
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-green-600">
                  {analytics.systemUsage.activeUsers}
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-xl">💾</Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold">
                      Stockage utilisé
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Tous les datasets
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-blue-600">
                  {analytics.systemUsage.totalStorage}
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-xl">⏱️</Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold">
                      Temps de traitement moyen
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Par génération
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-purple-600">
                  {analytics.systemUsage.avgProcessingTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View className="px-6 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Métriques de performance
          </Text>
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700 font-medium">Taux de réussite</Text>
                <View className="flex-row items-center">
                  <View className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                    <View className="w-3/4 h-full bg-green-500 rounded-full"></View>
                  </View>
                  <Text className="text-green-600 font-bold">87%</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700 font-medium">Satisfaction utilisateur</Text>
                <View className="flex-row items-center">
                  <View className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                    <View className="w-5/6 h-full bg-blue-500 rounded-full"></View>
                  </View>
                  <Text className="text-blue-600 font-bold">92%</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700 font-medium">Disponibilité système</Text>
                <View className="flex-row items-center">
                  <View className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                    <View className="w-full h-full bg-purple-500 rounded-full"></View>
                  </View>
                  <Text className="text-purple-600 font-bold">99%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="px-6 pb-6">
          <TouchableOpacity className="bg-blue-600 rounded-2xl p-4">
            <Text className="text-white text-center font-semibold text-lg">
              Exporter le rapport complet
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminAnalytics;
