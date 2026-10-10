import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const menuData = [
  {
    id: "1",
    title: "ID Card",
    subtitle: "This is your official ID card",
    icon: "card-outline",
    route: "/details/id-card",
  },
  {
    id: "2",
    title: "Offer Letter",
    subtitle: "This is your offer letter",
    icon: "document-text-outline",
    route: "/details/offer-letter",
  },
  {
    id: "3",
    title: "My Details",
    subtitle:
      "This is your personal information currently available",
    icon: "person-outline",
    route: "/details/my-details",
  },
];

export default function DetailsScreen() {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(item.route)}
    >
      <View style={styles.iconBox}>
        <Ionicons
          name={item.icon as any}
          size={25}
          color="#42c2b7"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {item.title}
        </Text>

        <Text style={styles.subtitle}>
          {item.subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={24}
        color="#42c2b7"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.note}>
        Note: Please contact admin in case of any discrepancy
      </Text>

      <FlatList
        data={menuData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  note: {
    textAlign: "center",
    color: "#777",
    fontStyle: "italic",
    fontSize: 14,
    marginTop: 10,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "#F3F7F1",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    flex: 1,
    marginLeft: 15,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    fontSize: 15,
    color: "#8A8A8A",
    marginTop: 4,
    lineHeight: 22,
  },
});