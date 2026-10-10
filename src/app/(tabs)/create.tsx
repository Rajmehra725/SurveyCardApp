import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  PostAPI,
  VibeAPI,
  MoodAPI,
  CapsuleAPI,
  GroupAPI,
  UploadAPI,
} from "../../services/api";
import { Palette, Radii, Shadows, Spacing } from "../../constants/theme";

const { width } = Dimensions.get("window");

const VIBE_BACKGROUNDS = [
  "#2563EB", // Primary Blue
  "#38BDF8", // Sky Blue
  "#06B6D4", // Accent Cyan
  "#16A34A", // Success Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#0B1220", // Midnight
];

const FEELINGS_LIST = [
  "Happy 😊",
  "Loved 🥰",
  "Chill ☕",
  "Excited ⚡",
  "Grateful 🙏",
  "Thoughtful 🤔",
  "Tired 😴",
  "Sad 🥺",
];

export default function CreateStudioScreen() {
  const [selectedType, setSelectedType] = useState<
    "moment" | "vibe" | "feeling" | "poll" | "loop" | "capsule"
  >("moment");

  // Form State
  const [text, setText] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [feeling, setFeeling] = useState("");
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState<"everyone" | "friends" | "inner_circle">("everyone");

  // Vibe specific
  const [vibeBg, setVibeBg] = useState(VIBE_BACKGROUNDS[0]);

  // Poll specific
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Capsule specific
  const [capsuleRecipient, setCapsuleRecipient] = useState("");
  const [capsuleDays, setCapsuleDays] = useState("7");

  // Processing state
  const [publishing, setPublishing] = useState(false);

  const handlePickMedia = async (isLoop = false) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: isLoop ? ["videos"] : ["images", "videos"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets[0]) {
        setMediaUri(res.assets[0].uri);
        setMediaType(res.assets[0].type === "video" ? "video" : "image");
      }
    } catch (e: any) {
      Alert.alert("Picker Error", e.message);
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      let uploadedUrl = "";
      if (mediaUri) {
        const upRes = await UploadAPI.uploadFile(
          mediaUri,
          mediaType === "video" ? "upload.mp4" : "upload.jpg",
          mediaType === "video" ? "video/mp4" : "image/jpeg"
        );
        if (upRes.data?.success) {
          uploadedUrl = upRes.data.file.url;
        }
      }

      if (selectedType === "moment" || selectedType === "loop") {
        if (!text.trim() && !uploadedUrl) {
          Alert.alert("Content Required", "Please enter text or pick media to publish.");
          setPublishing(false);
          return;
        }

        const mediaArray = uploadedUrl ? [{ url: uploadedUrl, fileType: mediaType }] : [];

        await PostAPI.create({
          text: text.trim(),
          media: mediaArray,
          feeling: feeling.trim(),
          location: location.trim(),
          audience,
        });

        Alert.alert("Moment Published! ✨", "Your moment is now live on SmileyX.", [
          {
            text: "View Feed",
            onPress: () => {
              resetForm();
              router.push("/(tabs)/home");
            },
          },
        ]);
      } else if (selectedType === "vibe") {
        if (!text.trim() && !uploadedUrl) {
          Alert.alert("Content Required", "Please type text or pick a photo for your Vibe.");
          setPublishing(false);
          return;
        }

        await VibeAPI.create({
          type: uploadedUrl ? "image" : "text",
          text: text.trim(),
          mediaUrl: uploadedUrl,
          backgroundColor: vibeBg,
          audience,
        });

        Alert.alert("Vibe Shared! 🌟", "Your Vibe is live for 24 hours.", [
          {
            text: "Done",
            onPress: () => {
              resetForm();
              router.push("/(tabs)/home");
            },
          },
        ]);
      } else if (selectedType === "feeling") {
        if (!feeling) {
          Alert.alert("Select Feeling", "Please tap one of the feelings below.");
          setPublishing(false);
          return;
        }

        const moodClean = feeling.toLowerCase().split(" ")[0];
        await MoodAPI.record({
          mood: moodClean,
          note: text.trim(),
          isPrivate: audience !== "everyone",
        });

        Alert.alert("Feeling Saved! ❤️", "Recorded in your MoodSpace journal.", [
          {
            text: "Home",
            onPress: () => {
              resetForm();
              router.push("/(tabs)/home");
            },
          },
        ]);
      } else if (selectedType === "poll") {
        if (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2) {
          Alert.alert("Incomplete Poll", "Enter a poll question and at least 2 options.");
          setPublishing(false);
          return;
        }

        const validOpts = pollOptions
          .filter((o) => o.trim())
          .map((text) => ({ text: text.trim(), votes: [] }));

        await PostAPI.create({
          text: text.trim(),
          poll: {
            question: pollQuestion.trim(),
            options: validOpts,
          },
          audience,
        });

        Alert.alert("Poll Live! 📊", "Friends can now vote on your poll.", [
          {
            text: "View Poll",
            onPress: () => {
              resetForm();
              router.push("/(tabs)/home");
            },
          },
        ]);
      } else if (selectedType === "capsule") {
        if (!text.trim()) {
          Alert.alert("Message Required", "Write the message for your TimeDrop capsule.");
          setPublishing(false);
          return;
        }

        const daysAhead = parseInt(capsuleDays) || 7;
        const deliverDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

        await CapsuleAPI.create({
          title: "Scheduled TimeDrop",
          message: text.trim(),
          deliverAt: deliverDate,
          isSelfCapsule: true,
        });

        Alert.alert(
          "TimeDrop Scheduled ⏳",
          `Will safely deliver in ${daysAhead} days.`,
          [
            {
              text: "Done",
              onPress: () => {
                resetForm();
                router.push("/(tabs)/home");
              },
            },
          ]
        );
      }
    } catch (e: any) {
      Alert.alert("Publish Failed", e.response?.data?.message || "Could not publish content.");
    } finally {
      setPublishing(false);
    }
  };

  const resetForm = () => {
    setText("");
    setMediaUri(null);
    setFeeling("");
    setLocation("");
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Studio</Text>
        <TouchableOpacity
          style={styles.publishHeaderBtn}
          onPress={handlePublish}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishHeaderBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Creator Type Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeSelectorRow}
        >
          {[
            { id: "moment", label: "Moment 📸", icon: "images" },
            { id: "vibe", label: "Vibe 🌟", icon: "sparkles" },
            { id: "feeling", label: "Feeling ❤️", icon: "heart" },
            { id: "poll", label: "Poll 📊", icon: "bar-chart" },
            { id: "loop", label: "Loop 🎬", icon: "videocam" },
            { id: "capsule", label: "TimeDrop ⏳", icon: "hourglass" },
          ].map((t) => {
            const isSelected = selectedType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.typeTab,
                  isSelected && styles.typeTabSelected,
                ]}
                onPress={() => setSelectedType(t.id as any)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    isSelected && styles.typeTabTextSelected,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content Card Form */}
        <View style={styles.editorCard}>
          {/* Main Caption / Note Input */}
          <TextInput
            style={styles.captionInput}
            placeholder={
              selectedType === "vibe"
                ? "Write a 24h Vibe thought..."
                : selectedType === "feeling"
                ? "Why are you feeling this way? (Private note)"
                : selectedType === "capsule"
                ? "Message for your future self..."
                : "What's on your mind? Share a moment..."
            }
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={text}
            onChangeText={setText}
          />

          {/* Media Preview if Selected */}
          {mediaUri ? (
            <View style={styles.mediaPreviewContainer}>
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              <TouchableOpacity
                style={styles.removeMediaBtn}
                onPress={() => setMediaUri(null)}
              >
                <Ionicons name="close-circle" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Vibe Background Picker (when Vibe is active) */}
          {selectedType === "vibe" && !mediaUri ? (
            <View style={styles.vibeBgSection}>
              <Text style={styles.fieldLabel}>Card Gradient / Background</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {VIBE_BACKGROUNDS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[
                      styles.colorDot,
                      { backgroundColor: bg },
                      vibeBg === bg && styles.colorDotSelected,
                    ]}
                    onPress={() => setVibeBg(bg)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Feelings Pill Selector (when Feeling or Moment) */}
          {(selectedType === "feeling" || selectedType === "moment") && (
            <View style={styles.feelingsSection}>
              <Text style={styles.fieldLabel}>Express a Feeling</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.feelingsScroll}
              >
                {FEELINGS_LIST.map((f) => {
                  const isSelected = feeling === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.feelingChip,
                        isSelected && styles.feelingChipSelected,
                      ]}
                      onPress={() => setFeeling(isSelected ? "" : f)}
                    >
                      <Text
                        style={[
                          styles.feelingChipText,
                          isSelected && styles.feelingChipTextSelected,
                        ]}
                      >
                        {f}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Poll Builder (when Poll is active) */}
          {selectedType === "poll" && (
            <View style={styles.pollSection}>
              <Text style={styles.fieldLabel}>Poll Question</Text>
              <TextInput
                style={styles.pollQuestionInput}
                placeholder="Ask your friends a question..."
                placeholderTextColor="#94A3B8"
                value={pollQuestion}
                onChangeText={setPollQuestion}
              />

              <Text style={styles.fieldLabel}>Poll Options</Text>
              {pollOptions.map((opt, idx) => (
                <TextInput
                  key={idx}
                  style={styles.pollOptionInput}
                  placeholder={`Option ${idx + 1}`}
                  placeholderTextColor="#94A3B8"
                  value={opt}
                  onChangeText={(val) => handleUpdatePollOption(idx, val)}
                />
              ))}

              {pollOptions.length < 4 && (
                <TouchableOpacity
                  style={styles.addOptionBtn}
                  onPress={handleAddPollOption}
                >
                  <Ionicons name="add" size={16} color={Palette.primaryBlue} />
                  <Text style={styles.addOptionText}>Add Option</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* TimeDrop Days Ahead (when Capsule is active) */}
          {selectedType === "capsule" && (
            <View style={styles.capsuleSection}>
              <Text style={styles.fieldLabel}>Deliver In Days</Text>
              <View style={styles.daysRow}>
                {["1", "7", "30", "365"].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dayBtn,
                      capsuleDays === d && styles.dayBtnSelected,
                    ]}
                    onPress={() => setCapsuleDays(d)}
                  >
                    <Text
                      style={[
                        styles.dayBtnText,
                        capsuleDays === d && styles.dayBtnTextSelected,
                      ]}
                    >
                      {d === "1"
                        ? "Tomorrow"
                        : d === "7"
                        ? "1 Week"
                        : d === "30"
                        ? "1 Month"
                        : "1 Year"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Location Input (Optional) */}
          {selectedType === "moment" && (
            <View style={styles.metaInputRow}>
              <Ionicons name="location-outline" size={18} color={Palette.primaryBlue} />
              <TextInput
                style={styles.metaInput}
                placeholder="Add location (optional)"
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          )}
        </View>

        {/* Media Attach Actions */}
        <View style={styles.attachActionsCard}>
          <TouchableOpacity
            style={styles.attachActionBtn}
            onPress={() => handlePickMedia(false)}
          >
            <Ionicons name="image-outline" size={22} color={Palette.primaryBlue} />
            <Text style={styles.attachActionText}>Add Photo / Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachActionBtn}
            onPress={() => handlePickMedia(true)}
          >
            <Ionicons name="videocam-outline" size={22} color={Palette.accentCyan} />
            <Text style={styles.attachActionText}>Short Loop Video</Text>
          </TouchableOpacity>
        </View>

        {/* Audience Selector */}
        <View style={styles.audienceCard}>
          <Text style={styles.fieldLabel}>Who can view this?</Text>
          <View style={styles.audienceOptionsRow}>
            {[
              { id: "everyone", label: "Everyone", icon: "globe-outline" },
              { id: "friends", label: "Friends Only", icon: "people-outline" },
              { id: "inner_circle", label: "Inner Circle", icon: "star-outline" },
            ].map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.audienceBtn,
                  audience === a.id && styles.audienceBtnSelected,
                ]}
                onPress={() => setAudience(a.id as any)}
              >
                <Ionicons
                  name={a.icon as any}
                  size={16}
                  color={audience === a.id ? "#FFFFFF" : Palette.secondaryTextLight}
                />
                <Text
                  style={[
                    styles.audienceBtnText,
                    audience === a.id && styles.audienceBtnTextSelected,
                  ]}
                >
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.lightBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Palette.primaryTextLight,
  },
  publishHeaderBtn: {
    backgroundColor: Palette.primaryBlue,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    ...Shadows.brandGlow,
  },
  publishHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  typeSelectorRow: {
    gap: 8,
    paddingBottom: 10,
  },
  typeTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  typeTabSelected: {
    backgroundColor: Palette.primaryBlue,
    borderColor: Palette.primaryBlue,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.secondaryTextLight,
  },
  typeTabTextSelected: {
    color: "#FFFFFF",
  },
  editorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginTop: 8,
    ...Shadows.sm,
  },
  captionInput: {
    fontSize: 15,
    color: Palette.primaryTextLight,
    minHeight: 90,
    textAlignVertical: "top",
  },
  mediaPreviewContainer: {
    marginTop: 10,
    borderRadius: Radii.lg,
    overflow: "hidden",
    position: "relative",
  },
  mediaPreview: {
    width: "100%",
    height: 220,
    borderRadius: Radii.lg,
  },
  removeMediaBtn: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  vibeBgSection: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.secondaryTextLight,
    marginBottom: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotSelected: {
    borderColor: "#111827",
  },
  feelingsSection: {
    marginTop: 14,
  },
  feelingsScroll: {
    gap: 8,
  },
  feelingChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  feelingChipSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    borderColor: Palette.primaryBlue,
  },
  feelingChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.secondaryTextLight,
  },
  feelingChipTextSelected: {
    color: Palette.primaryBlue,
    fontWeight: "800",
  },
  pollSection: {
    marginTop: 14,
  },
  pollQuestionInput: {
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingHorizontal: 12,
    marginBottom: 10,
    fontSize: 13,
    color: Palette.primaryTextLight,
  },
  pollOptionInput: {
    height: 40,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 12,
    color: Palette.primaryTextLight,
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  addOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.primaryBlue,
  },
  capsuleSection: {
    marginTop: 14,
  },
  daysRow: {
    flexDirection: "row",
    gap: 8,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    alignItems: "center",
  },
  dayBtnSelected: {
    backgroundColor: Palette.primaryBlue,
    borderColor: Palette.primaryBlue,
  },
  dayBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.secondaryTextLight,
  },
  dayBtnTextSelected: {
    color: "#FFFFFF",
  },
  metaInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
    gap: 8,
  },
  metaInput: {
    flex: 1,
    fontSize: 13,
    color: Palette.primaryTextLight,
  },
  attachActionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    ...Shadows.sm,
  },
  attachActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attachActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.primaryTextLight,
  },
  audienceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginTop: 12,
    ...Shadows.sm,
  },
  audienceOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  audienceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  audienceBtnSelected: {
    backgroundColor: Palette.primaryBlue,
    borderColor: Palette.primaryBlue,
  },
  audienceBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.secondaryTextLight,
  },
  audienceBtnTextSelected: {
    color: "#FFFFFF",
  },
});