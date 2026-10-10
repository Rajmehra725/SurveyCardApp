import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { MomentAPI, UploadAPI } from "../../services/api";
import { Palette, Radii, Shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");
const SAFFRON = Palette.primaryBlue;
const BG_WARM = Palette.lightBg;

const BG_COLORS = ["#2563EB", "#38BDF8", "#06B6D4", "#16A34A", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function MomentsScreen() {
  const [moments, setMoments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<any>(null);

  // Create Moment Form
  const [momentType, setMomentType] = useState<"text" | "image">("text");
  const [textContent, setTextContent] = useState("");
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    try {
      const res = await MomentAPI.getFeed();
      if (res.data?.success) {
        setMoments(res.data.moments || []);
      }
    } catch (e) {
      console.log("Fetch moments error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]) {
        setMediaUri(res.assets[0].uri);
        setMomentType("image");
      }
    } catch (err: any) {
      Alert.alert("Picker Error", err.message);
    }
  };

  const handlePostMoment = async () => {
    if (momentType === "text" && !textContent.trim()) {
      Alert.alert("Empty Moment", "Please type something for your moment.");
      return;
    }

    setPosting(true);
    try {
      let finalMediaUrl = "";
      if (momentType === "image" && mediaUri) {
        const upRes = await UploadAPI.uploadFile(mediaUri);
        if (upRes.data?.success) {
          finalMediaUrl = upRes.data.file.url;
        }
      }

      const res = await MomentAPI.create({
        type: momentType,
        text: textContent.trim(),
        mediaUrl: finalMediaUrl,
        backgroundColor: selectedBg,
        audience: "friends",
      });

      if (res.data?.success) {
        Alert.alert("Vibe Shared! ✨", "Your vibe is now live for 24 hours.");
        setShowCreateModal(false);
        setTextContent("");
        setMediaUri(null);
        fetchMoments();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not post vibe.");
    } finally {
      setPosting(false);
    }
  };

  const handleOpenMoment = async (moment: any) => {
    setSelectedMoment(moment);
    try {
      await MomentAPI.view(moment._id);
    } catch (e) {
      console.log("Moment view track error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Vibes</Text>
          <Text style={styles.subtitle}>24-Hour Stories • Shared with Friends</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Moments Feed */}
      {loading ? (
        <ActivityIndicator color={SAFFRON} style={{ marginTop: 40 }} />
      ) : moments.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.momentsGrid}
        >
          {moments.map((moment) => (
            <TouchableOpacity
              key={moment._id}
              style={[
                styles.momentCard,
                {
                  backgroundColor:
                    moment.type === "text" ? moment.backgroundColor || SAFFRON : "#FFFFFF",
                },
              ]}
              activeOpacity={0.85}
              onPress={() => handleOpenMoment(moment)}
            >
              {moment.type === "image" && moment.mediaUrl ? (
                <Image source={{ uri: moment.mediaUrl }} style={styles.momentImg} />
              ) : (
                <View style={styles.textMomentContent}>
                  <Text style={styles.textMomentBody} numberOfLines={4}>
                    {moment.text}
                  </Text>
                </View>
              )}

              {/* Creator Pill */}
              <View style={styles.creatorPill}>
                <View style={styles.creatorDot} />
                <Text style={styles.creatorName} numberOfLines={1}>
                  {moment.user?.fullName?.split(" ")[0]}
                </Text>
              </View>

              {/* Views count */}
              <View style={styles.viewsBadge}>
                <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
                <Text style={styles.viewsCount}>
                  {moment.viewers?.length || 0}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyView}>
          <Ionicons name="flame-outline" size={54} color="#D8CCC1" />
          <Text style={styles.emptyTitle}>No Moments Yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share what is on your mind today!
          </Text>
          <TouchableOpacity
            style={styles.postNowBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.postNowText}>Create a Moment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CREATE MOMENT MODAL */}
      <Modal visible={showCreateModal} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={26} color="#252525" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Vibe</Text>
            <TouchableOpacity
              style={styles.modalPostBtn}
              onPress={handlePostMoment}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalPostText}>Share</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Mode Selector */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, momentType === "text" && styles.modeTabActive]}
              onPress={() => setMomentType("text")}
            >
              <Text
                style={[
                  styles.modeTabText,
                  momentType === "text" && styles.modeTabTextActive,
                ]}
              >
                Text Vibe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, momentType === "image" && styles.modeTabActive]}
              onPress={handlePickImage}
            >
              <Text
                style={[
                  styles.modeTabText,
                  momentType === "image" && styles.modeTabTextActive,
                ]}
              >
                Photo Vibe
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preview / Canvas */}
          <View
            style={[
              styles.canvas,
              { backgroundColor: momentType === "text" ? selectedBg : "#111" },
            ]}
          >
            {momentType === "text" ? (
              <TextInput
                style={styles.canvasInput}
                placeholder="What's happening? Share a Vibe..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={textContent}
                onChangeText={setTextContent}
                multiline
                maxLength={200}
              />
            ) : mediaUri ? (
              <Image source={{ uri: mediaUri }} style={styles.canvasImg} />
            ) : (
              <TouchableOpacity
                style={styles.pickImgBtn}
                onPress={handlePickImage}
              >
                <Ionicons name="image" size={40} color="#FFFFFF" />
                <Text style={{ color: "#FFF", marginTop: 8, fontWeight: "700" }}>
                  Select Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Background Colors Palette (for text moments) */}
          {momentType === "text" && (
            <View style={styles.paletteRow}>
              {BG_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedBg === c && styles.colorDotActive,
                  ]}
                  onPress={() => setSelectedBg(c)}
                />
              ))}
            </View>
          )}

          <View style={styles.privacyNote}>
            <Ionicons name="time-outline" size={16} color="#777" />
            <Text style={styles.privacyNoteText}>
              Expires automatically in 24 hours. Friends only.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* VIEW MOMENT MODAL */}
      <Modal visible={!!selectedMoment} transparent animationType="fade">
        <View style={styles.viewModalOverlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.viewModalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.viewAvatar}>
                  <Text style={{ color: "#FFF", fontWeight: "800" }}>
                    {selectedMoment?.user?.fullName?.charAt(0) || "U"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.viewUserName}>
                    {selectedMoment?.user?.fullName}
                  </Text>
                  <Text style={styles.viewTime}>
                    {selectedMoment?.createdAt
                      ? new Date(selectedMoment.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setSelectedMoment(null)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.viewContent}>
              {selectedMoment?.type === "image" && selectedMoment?.mediaUrl ? (
                <Image
                  source={{ uri: selectedMoment.mediaUrl }}
                  style={styles.viewFullImg}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={[
                    styles.viewTextCard,
                    { backgroundColor: selectedMoment?.backgroundColor || SAFFRON },
                  ]}
                >
                  <Text style={styles.viewFullText}>{selectedMoment?.text}</Text>
                </View>
              )}
            </View>

            <View style={styles.viewFooter}>
              <View style={styles.viewCounterBox}>
                <Ionicons name="eye" size={18} color="#FFFFFF" />
                <Text style={styles.viewCounterText}>
                  {selectedMoment?.viewers?.length || 0} views
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_WARM,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3E8DE",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#252525",
  },
  subtitle: {
    fontSize: 12,
    color: "#777",
    fontWeight: "500",
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: SAFFRON,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  momentsGrid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  momentCard: {
    width: "48%",
    height: 220,
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
    elevation: 3,
  },
  momentImg: {
    width: "100%",
    height: "100%",
  },
  textMomentContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  textMomentBody: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 22,
  },
  creatorPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  creatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  creatorName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  viewsBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  viewsCount: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#252525",
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  postNowBtn: {
    backgroundColor: SAFFRON,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  postNowText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  modalPostBtn: {
    backgroundColor: SAFFRON,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalPostText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
  },
  modeTabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "#F3E8DE",
    borderRadius: 12,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: "#FFFFFF",
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
  },
  modeTabTextActive: {
    color: SAFFRON,
  },
  canvas: {
    margin: 20,
    height: 320,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    overflow: "hidden",
  },
  canvasInput: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    width: "100%",
  },
  canvasImg: {
    width: "100%",
    height: "100%",
  },
  pickImgBtn: {
    alignItems: "center",
  },
  paletteRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: "#252525",
  },
  privacyNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: "auto",
    marginBottom: 20,
  },
  privacyNoteText: {
    fontSize: 12,
    color: "#777",
  },
  viewModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  viewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  viewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: SAFFRON,
    alignItems: "center",
    justifyContent: "center",
  },
  viewUserName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  viewTime: {
    color: "#AAA",
    fontSize: 11,
  },
  viewContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  viewFullImg: {
    width: "100%",
    height: "80%",
  },
  viewTextCard: {
    padding: 26,
    borderRadius: 24,
    maxWidth: width - 40,
  },
  viewFullText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 30,
  },
  viewFooter: {
    padding: 20,
    alignItems: "center",
  },
  viewCounterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 6,
  },
  viewCounterText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
