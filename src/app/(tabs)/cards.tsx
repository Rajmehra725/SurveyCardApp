import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";


interface Card {
  _id: string;
  name: string;
  fatherName: string;
  phone: string;
  dob: string;
  profileImage: string;
  cardNumber: string;
  status: string;
}
import { API_BASE_URL } from "../../config/api";

const API_URL = `${API_BASE_URL}/api/cards`;

export default function CardsScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
const router = useRouter();
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.success) {
        setCards(result.data);
      }
    } catch (error) {
      console.log("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

 const renderCard = ({ item }: any) => {
    const imageUrl = item.profileImage
      ? `${API_BASE_URL}/${item.profileImage.replace(/\\/g, "/")}`
      : "https://i.pravatar.cc/150?img=32";

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.regLabel}>REG Mobile</Text>
            <Text style={styles.mobile}>{item.phone}</Text>
          </View>

          <View style={styles.logo}>
            <Text style={styles.logoText}>WS</Text>
          </View>

          <View>
            <Text style={styles.idLabel}>Web Solution ID</Text>
            <Text style={styles.idValue}>{item.cardNumber}</Text>
          </View>

         <TouchableOpacity
  style={styles.menuBtn}
  onPress={() =>
  router.push({
    pathname: "/cards/view",
    params: { id: item._id },
  })
}
>
  <Ionicons
    name="eye-outline"
    size={20}
    color="#fff"
  />
</TouchableOpacity>
        </View>

        {/* Company */}
        <View style={styles.companyBar}>
          <Text style={styles.companyText}>
            WEB SOLUTION Pvt. Ltd.
          </Text>
        </View>

        {/* CIN */}
        <View style={styles.cinContainer}>
          <Text style={styles.cinText}>
            CIN: U86909MP2025PTC075908
          </Text>
        </View>

        {/* Membership */}
        <View style={styles.membership}>
          <Text style={styles.membershipText}>
            Web Solution Subscription
          </Text>
        </View>

        {/* Details */}
        <View style={styles.middleRow}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.photo}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.valid}>
              Status: {item.status}
            </Text>

            <Text style={styles.smallText}>
              ई परामर्श एवं अन्य सेवाएं प्राप्त करें
            </Text>
          </View>

          <View style={styles.costBox}>
            <Text style={styles.costLabel}>Cost</Text>
            <Text style={styles.costValue}>₹ 60/-</Text>
          </View>
        </View>

        {/* Helpline */}
        <View style={styles.helpline}>
          <Text style={styles.helplineText}>
            Helpline : +91-7509291446
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          <Text style={styles.info}>{item.name}</Text>

          <Text style={styles.info}>
            DOB : {item.dob}
          </Text>

          <Text style={styles.info}>
            F/H : {item.fatherName}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            www.websolution.in
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#42c2b7"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={24}
          color="#42c2b7"
        />

        <TextInput
          placeholder="Search Card Number"
          placeholderTextColor="#999"
          style={styles.input}
        />
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 55,
  },

  input: {
    flex: 1,
    marginLeft: 10,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 4,
  },

  header: {
    backgroundColor: "#42c2b7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },

  regLabel: { color: "#fff", fontSize: 10 },
  mobile: {
    color: "#fff",
    fontWeight: "bold",
  },

  logo: {
    backgroundColor: "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    color: "#42c2b7",
    fontWeight: "bold",
  },

  idLabel: {
    color: "#fff",
    fontSize: 10,
  },

  idValue: {
    color: "#fff",
    fontWeight: "bold",
  },

  menuBtn: {
    padding: 5,
  },

  companyBar: {
    backgroundColor: "#e9faf8",
    padding: 8,
  },

  companyText: {
    textAlign: "center",
    fontWeight: "700",
  },

  cinContainer: {
    paddingVertical: 5,
  },

  cinText: {
    textAlign: "center",
    fontSize: 12,
  },

  membership: {
    backgroundColor: "#42c2b7",
    padding: 6,
  },

  membershipText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },

  middleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },

  photo: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
  },

  valid: {
    fontWeight: "600",
  },

  smallText: {
    fontSize: 12,
    color: "#555",
  },

  costBox: {
    alignItems: "center",
  },

  costLabel: {
    fontSize: 12,
  },

  costValue: {
    fontWeight: "bold",
  },

  helpline: {
    backgroundColor: "#f1f1f1",
    padding: 8,
  },

  helplineText: {
    textAlign: "center",
  },

  infoSection: {
    padding: 12,
  },

  info: {
    marginBottom: 4,
    fontWeight: "500",
  },

  footer: {
    backgroundColor: "#42c2b7",
    padding: 10,
  },

  footerText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
});