import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import { API_BASE_URL } from "../../config/api";

const API_BASE = API_BASE_URL;

export default function ViewCardScreen() {
  const { id } = useLocalSearchParams();

  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCard();
  }, []);

  const fetchCard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cards/${id}`);
      const data = await res.json();

      if (data.success) {
        setCard(data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#42c2b7" />
      </View>
    );
  }

  const profileImage = `${API_BASE}/${card.profileImage?.replace(
    /\\/g,
    "/"
  )}`;

  const aadhaarImage = `${API_BASE}/${card.aadhaarImage?.replace(
    /\\/g,
    "/"
  )}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
         <TouchableOpacity
  onPress={() => router.push("/(tabs)/cards")}
>
  <Ionicons
    name="arrow-back"
    size={28}
    color="#000"
  />
</TouchableOpacity>

          <Text style={styles.title}>Customer Details</Text>

          <View style={{ width: 28 }} />
        </View>

        <Image
          source={{ uri: profileImage }}
          style={styles.profileImage}
        />

        <Text style={styles.cardNumber}>
          {card.cardNumber}
        </Text>

        <Text style={styles.validText}>
          Status : {card.status}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{card.name}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Father's Name</Text>
          <Text style={styles.value}>{card.fatherName}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{card.phone}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DOB</Text>
          <Text style={styles.value}>{card.dob}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>District</Text>
          <Text style={styles.value}>{card.district}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>State</Text>
          <Text style={styles.value}>{card.state}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{card.address}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Aadhaar Number</Text>
          <Text style={styles.value}>{card.aadhaar}</Text>
        </View>

        <Text style={styles.imageTitle}>
          Aadhaar Card
        </Text>

        <Image
          source={{ uri: aadhaarImage }}
          style={styles.aadhaarImage}
          resizeMode="cover"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "500",
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    alignSelf: "center",
    marginTop: 10,
  },

  cardNumber: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 22,
    fontWeight: "600",
    color: "#7f8f58",
  },

  validText: {
    textAlign: "center",
    color: "#d19a9a",
    marginTop: 8,
    marginBottom: 20,
    fontSize: 18,
  },

  field: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  label: {
    color: "#999",
    fontSize: 13,
    marginBottom: 5,
  },

  value: {
    fontSize: 20,
    color: "#222",
  },

  imageTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
  },

  aadhaarImage: {
    width: "90%",
    height: 220,
    alignSelf: "center",
    borderRadius: 15,
    marginBottom: 30,
  },
});