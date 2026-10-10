import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function IdCardScreen() {
  const card = {
    janJeevanId: "260618-5C2A0D",
    memberName: "Raj mehra",
    fatherName: "Ramkaran ",
    dob: "01/01/2003",
    mobile: "7509291446",
    validUntil: "18-06-2027",
    cost: "0",
    helpline: "+91-6232633185",
    photo: "https://raaz-universe.vercel.app/static/media/raj.4d0a96b1326489011457.png",
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
       <TouchableOpacity
  onPress={() => router.push("/(tabs)/details")}
>
  <Ionicons
    name="arrow-back"
    size={28}
    color="#000"
  />
</TouchableOpacity>

        <Text style={styles.headerTitle}>
          ID Card
        </Text>

        <TouchableOpacity>
          <Ionicons
            name="download-outline"
            size={26}
            color="#4CAF50"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        This is your official ID card
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          {/* Top */}
          <View style={styles.topSection}>
            <View>
              <Text style={styles.regLabel}>
                REG Mobile
              </Text>

              <Text style={styles.mobile}>
                {card.mobile}
              </Text>
            </View>

            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>
                WS
              </Text>
            </View>

            <View>
              <Text style={styles.idLabel}>
                Web Solution ID
              </Text>

              <Text style={styles.idValue}>
                {card.janJeevanId}
              </Text>
            </View>
          </View>

          {/* Company */}
          <View style={styles.companyBar}>
            <Text style={styles.companyText}>
              web solution Pvt. Ltd.
            </Text>
          </View>

          {/* CIN */}
          <View style={styles.cinWrap}>
            <Text style={styles.cinText}>
              CIN: U86909MP2025PTC075908
            </Text>
          </View>

          {/* Membership */}
          <View style={styles.membershipWrap}>
            <Text style={styles.membership}>
             web solution Subscription
            </Text>
          </View>

          {/* Main */}
          <View style={styles.mainContent}>
            <Image
              source={{ uri: card.photo }}
              style={styles.photo}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.validText}>
                Valid Until:
              </Text>

              <Text style={styles.validDate}>
                {card.validUntil}
              </Text>

              <Text style={styles.small}>
                ई परामर्श एवं अन्य सेवाएं
              </Text>
            </View>

            <View style={styles.costBox}>
              <Text style={styles.costLabel}>
                Cost
              </Text>

              <Text style={styles.cost}>
                ₹ {card.cost}/-
              </Text>
            </View>
          </View>

          {/* Helpline */}
          <View style={styles.helplineBar}>
            <Text style={styles.helplineText}>
              Helpline : {card.helpline}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.infoSection}>
            <Text style={styles.info}>
              {card.memberName}
            </Text>

            <Text style={styles.info}>
              DOB : {card.dob}
            </Text>

            <Text style={styles.info}>
              F/H : {card.fatherName}
            </Text>

            <Text style={styles.info}>
              Seoni
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Privacy Policy And Terms Of Use
            </Text>

            <Text style={styles.footerText}>
              www.websolution.in
            </Text>
          </View>
        </View>

        {/* Action Buttons */}

        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons
            name="download-outline"
            size={20}
            color="#fff"
          />

          <Text style={styles.downloadText}>
            Download Card
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons
            name="share-social-outline"
            size={20}
            color="#4CAF50"
          />

          <Text style={styles.shareText}>
            Share Card
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    padding: 5,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    textAlign: "center",
    color: "#888",
    marginTop: 5,
    marginBottom: 15,
    fontStyle: "italic",
  },

  content: {
    padding: 15,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
  },

  topSection: {
    backgroundColor: "#FFD7D7",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  regLabel: {
    fontSize: 11,
  },

  mobile: {
    fontSize: 15,
    fontWeight: "700",
  },

  logoCircle: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#42c2b7",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  idLabel: {
    fontSize: 10,
  },

  idValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  companyBar: {
    backgroundColor: "#42c2b7",
    padding: 8,
  },

  companyText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  cinWrap: {
    padding: 10,
  },

  cinText: {
    backgroundColor: "#000",
    color: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
  },

  membershipWrap: {
    paddingHorizontal: 10,
  },

  membership: {
    backgroundColor: "#111",
    color: "#fff",
    alignSelf: "flex-start",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 11,
  },

  mainContent: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },

  photo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 12,
  },

  validText: {
    fontSize: 16,
    fontWeight: "600",
  },

  validDate: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  small: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },

  costBox: {
    backgroundColor: "#42c2b7",
    borderRadius: 10,
    padding: 10,
    minWidth: 75,
  },

  costLabel: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
  },

  cost: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 3,
  },

  helplineBar: {
    backgroundColor: "#E53935",
    padding: 10,
  },

  helplineText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  infoSection: {
    padding: 12,
  },

  info: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },

  footer: {
    backgroundColor: "#42c2b7",
    padding: 10,
  },

  footerText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
  },

  downloadBtn: {
    backgroundColor: "#42c2b7",
    height: 55,
    borderRadius: 14,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  downloadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  shareBtn: {
    height: 55,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#42c2b7",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  shareText: {
    color: "#42c2b7",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});