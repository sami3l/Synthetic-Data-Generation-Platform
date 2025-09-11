import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { adminService, AdminActionLog } from "../services/api/adminService";
import { router } from "expo-router";

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    totalRequests: 0,
    recentActions: 0,
  });
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Charger les statistiques et les logs en parallèle
      const [users, requests, logsData] = await Promise.all([
        adminService.getUsers({ limit: 1000 }),
        adminService.getRequests({ limit: 1000 }),
        adminService.getAdminActionLogs(0, 10),
      ]);

      const pendingRequests = requests.filter(
        (req) => req.status === "pending"
      ).length;

      setStats({
        totalUsers: users.length,
        totalRequests: requests.length,
        pendingRequests,
        recentActions: logsData.length,
      });

      setLogs(logsData); // Stocker les logs pour l'affichage
    } catch (error) {
      console.error("Error loading admin stats:", error);
      Alert.alert("Erreur", "Impossible de charger les statistiques");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatLogAction = (action: string, details: string | null) => {
    switch (action) {
      case "approve_request":
        return {
          text: "Requête approuvée",
          icon: "bg-green-500",
          description: details || "Approbation d'une requête",
        };
      case "reject_request":
        return {
          text: "Requête rejetée",
          icon: "bg-red-500",
          description: details || "Rejet d'une requête",
        };
      case "create_user":
        return {
          text: "Utilisateur créé",
          icon: "bg-blue-500",
          description: details || "Nouvel utilisateur ajouté",
        };
      case "update_user":
        return {
          text: "Utilisateur modifié",
          icon: "bg-orange-500",
          description: details || "Modification d'un utilisateur",
        };
      case "delete_user":
        return {
          text: "Utilisateur supprimé",
          icon: "bg-red-500",
          description: details || "Suppression d'un utilisateur",
        };
      default:
        return {
          text: action.replace("_", " "),
          icon: "bg-gray-500",
          description: details || "Action administrative",
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minutes`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? "s" : ""}`;
    } else {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? "s" : ""}`;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  const statsCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      icon: "👥",
      color: "bg-blue-500",
      description: "Total des utilisateurs",
    },
    {
      title: "Requêtes en attente",
      value: stats.pendingRequests,
      icon: "⏳",
      color: "bg-orange-500",
      description: "À traiter",
    },
    {
      title: "Total requêtes",
      value: stats.totalRequests,
      icon: "📋",
      color: "bg-green-500",
      description: "Toutes les requêtes",
    },
    {
      title: "Actions récentes",
      value: stats.recentActions,
      icon: "📝",
      color: "bg-purple-500",
      description: "Historique",
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">
          Chargement des statistiques...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 web:max-w-7xl web:mx-auto">
      <ScrollView
        className="flex-1 web:px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Header moderne avec gradient */}
        <View className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-b-3xl mb-8 web:rounded-2xl web:mt-6">
          <Text className="text-white text-center text-4xl font-bold mb-3">
            🛡️ Administration
          </Text>
          <Text className="text-gray-100 text-center text-lg">
            Tableau de bord administrateur
          </Text>
        </View>

        {/* Statistics Cards avec grid responsive */}
        <View className="px-4 mb-8 web:px-0">
          <Text className="text-2xl font-bold text-gray-900 mb-6 web:text-3xl">
            Vue d&apos;ensemble
          </Text>
          <View className="flex-row flex-wrap justify-between web:grid web:grid-cols-4 web:gap-6">
            {statsCards.map((card, index) => (
              <View
                key={index}
                className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100 web:mb-0 web:transform web:transition-all web:duration-200 web:hover:scale-105 web:hover:shadow-lg"
                style={{ width: Platform.OS === "web" ? "auto" : "48%" }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View
                    className={`w-14 h-14 ${card.color} rounded-2xl items-center justify-center web:w-16 web:h-16`}
                  >
                    <Text className="text-white text-2xl web:text-3xl">
                      {card.icon}
                    </Text>
                  </View>
                  <Text className="text-3xl font-bold text-gray-900 web:text-4xl">
                    {card.value}
                  </Text>
                </View>
                <Text className="text-gray-900 font-semibold text-base mb-1">
                  {card.title}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {card.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-8 web:px-0">
          <Text className="text-2xl font-bold text-gray-900 mb-6 web:text-3xl">
            Actions rapides
          </Text>
          <View className="web:grid web:grid-cols-3 web:gap-6">
            <TouchableOpacity
              className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100 w-full web:mb-0 web:transform web:transition-all web:duration-200 web:hover:shadow-lg web:hover:scale-105"
              onPress={() => router.push("/admin-users")}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-xl">👥</Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold text-base">
                      Gérer les utilisateurs
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {stats.totalUsers} utilisateurs enregistrés
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
               className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100 w-full web:mb-0 web:transform web:transition-all web:duration-200 web:hover:shadow-lg web:hover:scale-105"
              onPress={() => router.push("/admin-requests")}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-orange-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-xl">📋</Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold text-base">
                      Requêtes en attente
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {stats.pendingRequests} requêtes à traiter
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
               className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100 w-full web:mb-0 web:transform web:transition-all web:duration-200 web:hover:shadow-lg web:hover:scale-105"
              onPress={() => router.push("/admin-logs")}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-xl">📝</Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold text-base">
                      Journaux d&apos;activité
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {stats.recentActions} actions récentes
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity avec layout responsive et centrage */}
        <View className="px-4 mb-8 web:px-0 web:flex web:justify-center">
          <View className="web:max-w-4xl web:w-full">
            <Text className="text-2xl font-bold text-gray-900 mb-6 web:text-3xl web:text-center">
              Activité récente
            </Text>

            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 web:transform web:transition-all web:duration-200 web:hover:shadow-lg">
              {logs.length > 0 ? (
                <View className="space-y-4">
                  {logs.slice(0, 4).map((log) => {
                    const actionInfo = formatLogAction(log.action, log.details);
                    return (
                      <View key={log.id} className="flex-row items-start">
                        <View
                          className={`w-3 h-3 ${actionInfo.icon} rounded-full mt-2 mr-3`}
                        ></View>
                        <View className="flex-1">
                          <Text className="font-medium text-gray-700">
                            {actionInfo.text}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {actionInfo.description} •{" "}
                            {formatTimeAgo(log.created_at)}
                          </Text>
                          {log.target_user_id && (
                            <Text className="text-xs text-gray-400">
                              Utilisateur cible: #{log.target_user_id}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="text-center py-8">
                  <Text className="text-gray-500 text-lg">
                    Aucune activité récente
                  </Text>
                  <Text className="text-gray-400 text-sm mt-2">
                    Les actions administratives apparaîtront ici
                  </Text>
                </View>
              )}

              <TouchableOpacity
                className="mt-4 pt-4 border-t border-gray-100"
                onPress={() => router.push("/admin-logs")}
              >
                <Text className="text-center text-blue-600 font-medium">
                  Voir toute l&apos;activité →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* System Status */}
        <View className="web:col-span-1">
          <Text className="text-2xl font-bold text-gray-900 mb-6 web:text-3xl">
            État du système
          </Text>
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 web:transform web:transition-all web:duration-200 web:hover:shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Statut général
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Base de données</Text>
                <Text className="text-green-600 font-medium">Connectée</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">API Backend</Text>
                <Text className="text-green-600 font-medium">
                  Fonctionnelle
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Stockage fichiers</Text>
                <Text className="text-green-600 font-medium">Disponible</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="px-4 pb-8 web:px-0">
          <Text className="text-gray-500 text-center text-sm web:text-base">
            Panneau d&apos;administration • Version 1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminHome;
