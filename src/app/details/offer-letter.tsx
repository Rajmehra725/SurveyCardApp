import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function OfferLetterScreen() {
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
          Offer Letter
        </Text>

        <View style={{ width: 30 }} />
      </View>

      <Text style={styles.subtitle}>
        This is your official offer letter
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.letterCard}>
          <Text style={styles.company}>
            WEB SOLUTION Pvt. Ltd.
          </Text>

          <Text style={styles.date}>
            Date: 18/06/2026
          </Text>

          <Text style={styles.heading}>
            OFFER LETTER
          </Text>

          <Text style={styles.body}>
            Dear Raj Mehra,
          </Text>

          <Text style={styles.body}>
            We are pleased to offer you the position
            of Survey Executive at WEB SOLUTION Pvt. Ltd.
          </Text>

          <Text style={styles.body}>
            Based on your qualifications and
            experience, we believe you will be a
            valuable member of our organization.
          </Text>

          <Text style={styles.body}>
            Your responsibilities will include
            conducting surveys, collecting field
            data, maintaining records and supporting
            company operations.
          </Text>

          <Text style={styles.body}>
            We look forward to having you as part
            of our team and wish you success in
            your role.
          </Text>

          <View style={styles.signatureSection}>
            <View>
              <Text style={styles.signLine}>
                _________________
              </Text>

              <Text style={styles.signLabel}>
                Employee Signature
              </Text>
            </View>

            <View>
              <Text style={styles.signLine}>
                _________________
              </Text>

              <Text style={styles.signLabel}>
                Authorized Signatory
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons
            name="download-outline"
            size={20}
            color="#fff"
          />

          <Text style={styles.downloadText}>
            Download Offer Letter
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 5,
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  letterCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    elevation: 4,
  },

  company: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#4CAF50",
    marginBottom: 8,
  },

  date: {
    textAlign: "right",
    color: "#666",
    marginBottom: 20,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#222",
  },

  body: {
    fontSize: 16,
    color: "#444",
    lineHeight: 28,
    marginBottom: 15,
  },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },

  signLine: {
    fontSize: 16,
    color: "#444",
  },

  signLabel: {
    marginTop: 5,
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },

  downloadBtn: {
    backgroundColor: "#4CAF50",
    height: 56,
    borderRadius: 15,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  downloadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});