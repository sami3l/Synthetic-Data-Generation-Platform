import { View, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";

export default function IndexScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="mt-4 text-gray-600">Loading...</Text>
    </View>
  );
}
