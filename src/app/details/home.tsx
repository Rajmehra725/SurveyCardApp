import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { API_BASE_URL } from "../../config/api";

const API_URL = `${API_BASE_URL}/api/cards`;

export default function HomeScreen() {
  const [totalCards, setTotalCards] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);
  const [pendingCards, setPendingCards] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.success) {
        const cards = result.data || [];

        setTotalCards(cards.length);

        const completed = cards.filter(
          (card: any) =>
            card.status?.toLowerCase() === "approved" ||
            card.status?.toLowerCase() === "success"
        ).length;

        const pending = cards.filter(
          (card: any) =>
            card.status?.toLowerCase() === "pending"
        ).length;

        setCompletedCards(completed);
        setPendingCards(pending);
      }
    } catch (error) {
      console.log("Dashboard Error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <Image
              source={{
                uri: "https://raaz-universe.vercel.app/static/media/raj.4d0a96b1326489011457.png",
              }}
              style={styles.avatar}
            />

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.greeting}>
                Good Afternoon!
              </Text>

              <Text style={styles.name}>
                Raj Mehra
              </Text>
            </View>
          </View>

          <Text style={styles.heading}>
            Together
            Towards Better
            Solution!
          </Text>

          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3209/3209265.png",
            }}
            style={styles.doctor}
          />
        </View>

        {/* Search */}
        <View style={styles.searchCard}>
          <Ionicons
            name="search"
            size={22}
            color="#7CC242"
          />

          <TextInput
            placeholder="Search here for Web Solution user ID"
            placeholderTextColor="#A1A1AA"
            style={styles.input}
          />
        </View>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>
              Total Cards
            </Text>

            <Text style={styles.totalNumber}>
              {totalCards}
            </Text>
          </View>

          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
            }}
            style={styles.cardImage}
          />
        </View>

        {/* Section */}
        <Text style={styles.sectionTitle}>
          Print Cards 👉
        </Text>

        <View style={styles.cardsRow}>
          {/* Completed */}
          <View style={styles.completedCard}>
            <Ionicons
              name="checkmark-circle"
              size={30}
              color="#42c2b7"
            />

            <Text style={styles.cardTitle}>
              Print Completed
            </Text>

            <Text style={styles.cardCount}>
              {completedCards}
            </Text>
          </View>

          {/* Pending */}
          <View style={styles.pendingCard}>
            <Ionicons
              name="close-circle"
              size={30}
              color="#EF4444"
            />

            <Text style={styles.cardTitle}>
              Print Pending
            </Text>

            <Text style={styles.cardCount}>
              {pendingCards}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  header: {
    height: 250,
    backgroundColor: "#42c2b7",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 15,
    overflow: "hidden",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  greeting: {
    color: "#F3F4F6",
    fontSize: 14,
    fontWeight: "500",
  },

  name: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 2,
  },

  heading: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 30,
    marginTop: 35,
    width: "55%",
  },

  doctor: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 170,
    height: 170,
    resizeMode: "contain",
  },

  searchCard: {
    marginHorizontal: 18,
    marginTop: -28,
    backgroundColor: "#fff",
    height: 58,
    borderRadius: 29,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111827",
  },

  totalCard: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  totalLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  totalNumber: {
    fontSize: 42,
    color: "#42c2b7",
    fontWeight: "800",
    marginTop: 5,
  },

  cardImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 12,
  },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },

  completedCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D9F99D",
  },

  pendingCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 10,
  },

  cardCount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginTop: 6,
  },
});