import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

interface AdminQuickActionProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  bgColor?: string;
  textColor?: string;
}

const AdminQuickAction: React.FC<AdminQuickActionProps> = ({
  title,
  description,
  icon,
  onPress,
  bgColor = 'bg-white',
  textColor = 'text-gray-900'
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgColor} rounded-2xl p-6 shadow-sm border border-gray-100 active:scale-95`}
      activeOpacity={0.8}
    >
      <View className="items-center">
        <Text className="text-4xl mb-3">{icon}</Text>
        <Text className={`text-lg font-semibold ${textColor} mb-1 text-center`}>
          {title}
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default AdminQuickAction;
