import React from 'react';
import { View } from 'react-native';
import RequestManagement from '../components/RequestManagement';

const AdminRequestsScreen: React.FC = () => {
  return (
    <View className="flex-1">
      <RequestManagement />
    </View>
  );
};

export default AdminRequestsScreen;
