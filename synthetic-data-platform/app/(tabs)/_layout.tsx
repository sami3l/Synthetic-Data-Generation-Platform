import { Tabs } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "react-native-paper";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "@/hooks/useAuth";

export default function TabsLayout() {
  const theme = useTheme();
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="auto-fix" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="format-list-bulleted" size={24} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="bell" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="account" size={24} color={color} />
          ),
        }}
      />

      {/* Only add Admin tab if user is admin */}
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="shield-account" size={24} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}

// export default function TabsLayout() {
//   const theme = useTheme();
//   const { user } = useAuth();

//   const isAdmin = user?.role === "admin"; // ✅ basé directement sur Redux

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: theme.colors.primary,
//       }}
//     >
//       <Tabs.Screen
//         name="home"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="generate"
//         options={{
//           title: "Generate",
//           tabBarIcon: ({ color }) => <Icon name="auto-fix" size={24} color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="requests"
//         options={{
//           title: "Requests",
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="format-list-bulleted" size={24} color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="notifications"
//         options={{
//           title: "Notifications",
//           tabBarIcon: ({ color }) => <Icon name="bell" size={24} color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="account" size={24} color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="admin"
//         options={{
//           title: "Admin",
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="shield-account" size={24} color={color} />,
//           href: isAdmin ? undefined : null, // ✅ dépend uniquement de Redux
//         }}
//       />
//     </Tabs>
//   );
// }
