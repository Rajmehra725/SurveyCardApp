import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CapsuleAPI } from "../services/api";
import { Palette, Radii, Shadows } from "../constants/theme";

const SAFFRON = Palette.primaryBlue;
const BG_WARM = Palette.lightBg;

export default function TimeCapsuleScreen() {
  const [sentCapsules, setSentCapsules] = useState<any[]>([]);
  const [receivedCapsules, setReceivedCapsules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"create" | "view">("create");

  // Form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [days, setDays] = useState("7");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    try {
      const res = await CapsuleAPI.getMy();
      if (res.data?.success) {
        setSentCapsules(res.data.sent || []);
        setReceivedCapsules(res.data.received || []);
      }
    } catch (e) {
      console.log("Fetch capsules error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSealCapsule = async () => {
    if (!message.trim()) {
      Alert.alert("Empty Capsule", "Please write a message for your future capsule.");
      return;
    }

    setSubmitting(true);
    try {
      const deliverAt = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);
      const res = await CapsuleAPI.create({
        title: title.trim() || "Letter to My Future Self",
        message: message.trim(),
        deliverAt,
        isSelfCapsule: true,
      });

      if (res.data?.success) {
        Alert.alert(
          "Capsule Sealed! ⏳",
          `Your capsule will be securely stored and delivered in ${days} days.`
        );
        setTitle("");
        setMessage("");
        fetchCapsules();
        setActiveTab("view");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not seal capsule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#252525" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Time Capsules ⏳</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Switch Tab */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "create" && styles.tabBtnActive]}
          onPress={() => setActiveTab("create")}
        >
          <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
            Seal New Capsule
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "view" && styles.tabBtnActive]}
          onPress={() => setActiveTab("view")}
        >
          <Text style={[styles.tabText, activeTab === "view" && styles.tabTextActive]}>
            My Capsules ({sentCapsules.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "create" ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="hourglass" size={26} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Send a Message into the Future</Text>
            <Text style={styles.cardSubtitle}>
              Persistent backend scheduler ensures delivery on the exact day specified.
            </Text>

            <Text style={styles.inputLabel}>Capsule Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Goals for next month"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Delivery Timeframe</Text>
            <View style={styles.pillRow}>
              {[
                { d: "1", label: "Tomorrow" },
                { d: "7", label: "1 Week" },
                { d: "30", label: "1 Month" },
                { d: "365", label: "1 Year" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.d}
                  style={[styles.pill, days === item.d && styles.pillActive]}
                  onPress={() => setDays(item.d)}
                >
                  <Text style={[styles.pillText, days === item.d && styles.pillTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Secret Message</Text>
            <TextInput
              style={[styles.input, { height: 130 }]}
              placeholder="Write memories, reminders, or secret wishes..."
              placeholderTextColor="#999"
              multiline
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSealCapsule}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Seal Capsule</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* My Capsules List */
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.listSectionTitle}>Pending Capsules (Sealed)</Text>
          {loading ? (
            <ActivityIndicator color={SAFFRON} />
          ) : sentCapsules.length > 0 ? (
            sentCapsules.map((c) => (
              <View key={c._id} style={styles.capsuleCard}>
                <View style={styles.capsuleIconBox}>
                  <Ionicons name="lock-closed" size={20} color={SAFFRON} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.capsuleTitle}>{c.title}</Text>
                  <Text style={styles.capsuleDate}>
                    Unlocks: {new Date(c.deliverAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.capsuleStatus}>{c.status}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No sealed capsules yet.</Text>
          )}

          {receivedCapsules.length > 0 && (
            <>
              <Text style={[styles.listSectionTitle, { marginTop: 24 }]}>
                Opened Capsules
              </Text>
              {receivedCapsules.map((c) => (
                <View key={c._id} style={styles.capsuleCard}>
                  <View style={[styles.capsuleIconBox, { backgroundColor: "#DCFCE7" }]}>
                    <Ionicons name="mail-open" size={20} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.capsuleTitle}>{c.title}</Text>
                    <Text style={styles.capsuleMsg}>{c.message}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_WARM,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3E8DE",
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#252525",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3E8DE",
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFF9F2",
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: SAFFRON,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3E8DE",
    elevation: 3,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#252525",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
    marginBottom: 14,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF9F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EADFD6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#252525",
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFF9F2",
    borderWidth: 1,
    borderColor: "#EADFD6",
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: SAFFRON,
    borderColor: SAFFRON,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  primaryBtn: {
    backgroundColor: SAFFRON,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#252525",
    marginBottom: 10,
  },
  capsuleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  capsuleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFF3E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  capsuleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#252525",
  },
  capsuleDate: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  capsuleMsg: {
    fontSize: 12,
    color: "#444",
    marginTop: 4,
  },
  capsuleStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: SAFFRON,
    textTransform: "capitalize",
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
  },
});
