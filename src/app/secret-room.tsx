import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SecretRoomAPI } from "../services/api";
import { Palette, Radii, Shadows } from "../constants/theme";

const SAFFRON = Palette.primaryBlue;
const BG_WARM = Palette.lightBg;

export default function SecretRoomScreen() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await SecretRoomAPI.create({
        title: title.trim() || "Secret Room",
        durationMinutes: parseInt(duration) || 60,
      });

      if (res.data?.success) {
        const room = res.data.room;
        Alert.alert(
          "Secret Room Created! 🔒",
          `Invite Code: ${room.code}\n\nShare this code with your invitee.`,
          [
            {
              text: "Enter Secret Room",
              onPress: () => router.push(`/chat/${room.conversationId}` as any),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not create secret room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Code Required", "Please enter the invitation code.");
      return;
    }

    setLoading(true);
    try {
      const res = await SecretRoomAPI.join(joinCode.trim().toUpperCase());
      if (res.data?.success) {
        router.push(`/chat/${res.data.room.conversationId}` as any);
      }
    } catch (err: any) {
      Alert.alert("Failed", err.response?.data?.message || "Invalid or expired secret room code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#252525" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secret Rooms 🔒</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Card: Create */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="key" size={26} color={SAFFRON} />
          </View>
          <Text style={styles.cardTitle}>Create a Private Secret Room</Text>
          <Text style={styles.cardSubtitle}>
            Temporary, invitation-only space. Messages expire after configured time.
          </Text>

          <Text style={styles.inputLabel}>Room Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Private Discussion"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Generate Room Code</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR JOIN EXISTING</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Card: Join */}
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Ionicons name="enter-outline" size={26} color="#F59E0B" />
          </View>
          <Text style={styles.cardTitle}>Join with Invitation Code</Text>
          <Text style={styles.cardSubtitle}>
            Enter the 6-character code given by the room creator.
          </Text>

          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="CODE"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            maxLength={8}
            value={joinCode}
            onChangeText={setJoinCode}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#F59E0B" }]}
            onPress={handleJoin}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: "rgba(255,122,0,0.12)",
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
  codeInput: {
    letterSpacing: 4,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
  },
  primaryBtn: {
    backgroundColor: SAFFRON,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EADFD6",
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#999",
  },
});
