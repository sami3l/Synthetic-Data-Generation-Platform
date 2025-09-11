import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { adminService } from '../services/api/adminService';

export const useAdminService = () => {
  const [loading, setLoading] = useState(false);

  // Gestion des utilisateurs
  const getUsers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const users = await adminService.getUsers(params);
      return users;
    } catch (error) {
      console.error('Erreur getUsers:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserDetail = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const user = await adminService.getUserDetail(userId);
      return user;
    } catch (error) {
      console.error('Erreur getUserDetail:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de l\'utilisateur');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserActive = useCallback(async (userId: number, isActive: boolean) => {
    setLoading(true);
    try {
      const user = await adminService.updateUserActive(userId, isActive);
      Alert.alert('Succès', `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`);
      return user;
    } catch (error) {
      console.error('Erreur updateUserActive:', error);
      Alert.alert('Erreur', 'Impossible de modifier le statut de l\'utilisateur');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: number, role: string) => {
    setLoading(true);
    try {
      const user = await adminService.updateUserRole(userId, role);
      Alert.alert('Succès', `Rôle modifié vers ${role} avec succès`);
      return user;
    } catch (error) {
      console.error('Erreur updateUserRole:', error);
      Alert.alert('Erreur', 'Impossible de modifier le rôle');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      await adminService.deleteUser(userId);
      Alert.alert('Succès', 'Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gestion des requêtes
  const getRequests = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const requests = await adminService.getRequests(params);
      return requests;
    } catch (error) {
      console.error('Erreur getRequests:', error);
      Alert.alert('Erreur', 'Impossible de charger les requêtes');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRequest = useCallback(async (requestId: number) => {
    setLoading(true);
    try {
      const request = await adminService.approveRequest(requestId);
      Alert.alert('Succès', 'Requête approuvée avec succès');
      return request;
    } catch (error) {
      console.error('Erreur approveRequest:', error);
      Alert.alert('Erreur', 'Impossible d\'approuver la requête');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectRequest = useCallback(async (requestId: number, reason: string) => {
    setLoading(true);
    try {
      const request = await adminService.rejectRequest(requestId, reason);
      Alert.alert('Succès', 'Requête rejetée avec succès');
      return request;
    } catch (error) {
      console.error('Erreur rejectRequest:', error);
      Alert.alert('Erreur', 'Impossible de rejeter la requête');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gestion des logs
  const getAdminActionLogs = useCallback(async (skip = 0, limit = 50) => {
    setLoading(true);
    try {
      const logs = await adminService.getAdminActionLogs(skip, limit);
      return logs;
    } catch (error) {
      console.error('Erreur getAdminActionLogs:', error);
      Alert.alert('Erreur', 'Impossible de charger les logs');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    // Utilisateurs
    getUsers,
    getUserDetail,
    updateUserActive,
    updateUserRole,
    deleteUser,
    // Requêtes
    getRequests,
    approveRequest,
    rejectRequest,
    // Logs
    getAdminActionLogs,
  };
};
