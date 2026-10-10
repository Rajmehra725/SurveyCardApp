import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Palette, Colors, Shadows } from "../constants/theme";

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  badge?: number;
  isCreate?: boolean;
};

function TabIcon({ name, focused, badge, isCreate }: TabIconProps) {
  if (isCreate) {
    return (
      <View style={styles.createButtonContainer}>
        <View style={styles.createButtonInner}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.iconContainer}>
      {focused && <View style={styles.activeBackground} />}
      <Ionicons
        name={name}
        size={22}
        color={focused ? Palette.primaryBlue : "#64748B"}
      />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Palette.primaryBlue,
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarStyle: {
          height: Platform.OS === "ios" ? 86 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: Palette.borderLight,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 1,
        },
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              focused={focused}
            />
          ),
        }}
      />

      {/* 2. DISCOVER */}
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "compass" : "compass-outline"}
              focused={focused}
            />
          ),
        }}
      />

      {/* 3. CREATE STUDIO (Visually Emphasized) */}
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="add"
              focused={focused}
              isCreate
            />
          ),
        }}
      />

      {/* 4. CHAT */}
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              focused={focused}
            />
          ),
        }}
      />

      {/* 5. MY SPACE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Space",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
            />
          ),
        }}
      />

      {/* Hidden secondary/legacy routes retained for deep linking and backward compatibility */}
      <Tabs.Screen name="moments" options={{ href: null }} />
      <Tabs.Screen name="contacts" options={{ href: null }} />
      <Tabs.Screen name="raaz" options={{ href: null }} />
      <Tabs.Screen name="cards" options={{ href: null }} />
      <Tabs.Screen name="details" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 38,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeBackground: {
    position: "absolute",
    width: 38,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(37, 99, 235, 0.10)",
  },
  badge: {
    position: "absolute",
    right: -4,
    top: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
  },
  createButtonContainer: {
    top: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...Shadows.brandGlow,
  },
});