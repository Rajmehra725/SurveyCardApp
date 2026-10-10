import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";
import { AuthAPI, UserAPI, PostAPI } from "../../services/api";
import { disconnectSocket } from "../../services/socket";
import { Palette, Radii, Shadows } from "../../constants/theme";

const SAFFRON = Palette.primaryBlue;
const BG_WARM = Palette.lightBg;

const MOODS = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "focused", emoji: "🎯", label: "Focused" },
  { id: "tired", emoji: "😴", label: "Tired" },
  { id: "need_company", emoji: "☕", label: "Need Company" },
  { id: "need_space", emoji: "🌿", label: "Need Space" },
  { id: "sad", emoji: "🥺", label: "Sad" },
];

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Ghost Mode & Privacy
  const [ghostMode, setGhostMode] = useState(false);
  const [showOnline, setShowOnline] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);

  // Current Mood
  const [selectedMood, setSelectedMood] = useState("");

  // User Posts & Content Spaces
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"moments" | "loops" | "keepsakes" | "capsules">("moments");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Settings Hamburger Menu Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [msgNotifs, setMsgNotifs] = useState(true);
  const [reactionNotifs, setReactionNotifs] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [mediaAutoDownload, setMediaAutoDownload] = useState(true);
  const [disappearingMessages, setDisappearingMessages] = useState(false);

  // Modals
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [updating, setUpdating] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchUserPosts = async (userId: string) => {
    setPostsLoading(true);
    try {
      const res = await PostAPI.getUserPosts(userId);
      if (res.data?.success) {
        setUserPosts(res.data.posts || []);
      }
    } catch (e) {
      console.log("Error fetching user posts:", e);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await AuthAPI.getProfile();
      if (res.data?.success && res.data.user) {
        const u = res.data.user;
        setUser(u);
        setEditName(u.fullName || "");
        setEditBio(u.bio || "");
        setGhostMode(u.privacySettings?.ghostMode || false);
        setShowOnline(u.privacySettings?.showOnline !== false);
        setShowLastSeen(u.privacySettings?.showLastSeen !== false);
        setShowReadReceipts(u.privacySettings?.showReadReceipts !== false);
        setSelectedMood(u.currentMood?.mood || "");
        fetchUserPosts(u._id);
      }
    } catch (e) {
      console.log("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGhostMode = async (val: boolean) => {
    setGhostMode(val);
    try {
      await UserAPI.updatePrivacy({ ghostMode: val });
    } catch (e) {
      console.log("Privacy update error:", e);
    }
  };

  const handleSelectMood = async (moodId: string) => {
    const nextMood = selectedMood === moodId ? "" : moodId;
    setSelectedMood(nextMood);
    try {
      await UserAPI.updateMood({ mood: nextMood });
    } catch (e) {
      console.log("Mood error:", e);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }

    setUpdating(true);
    try {
      const res = await UserAPI.updateProfile({
        fullName: editName.trim(),
        bio: editBio.trim(),
      });

      if (res.data?.success) {
        setUser(res.data.user);
        await AsyncStorage.setItem("raaz_user", JSON.stringify(res.data.user));
        setShowEditModal(false);
        Alert.alert("Success", "Profile updated successfully.");
      }
    } catch (err: any) {
      Alert.alert("Update Error", err.response?.data?.message || "Could not update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim()) {
      Alert.alert("Fields Required", "Please enter current and new passwords.");
      return;
    }

    try {
      const res = await AuthAPI.changePassword({
        currentPassword: oldPassword,
        newPassword,
      });

      if (res.data?.success) {
        Alert.alert("Success", "Password changed successfully.");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Incorrect current password");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out of SmileyX?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await AuthAPI.logout();
          } catch (e) {}
          disconnectSocket();
          await AsyncStorage.multiRemove([
            "smileyx_access_token",
            "smileyx_refresh_token",
            "smileyx_user",
            "raaz_access_token",
            "raaz_refresh_token",
            "raaz_user",
          ]);
          router.replace("/");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={SAFFRON} />
      </View>
    );
  }

  const raazId = user?.username ? `@${user.username}` : "@raaz_user";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ================= PROFILE CARD ================= */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {user?.fullName?.charAt(0) || "U"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.qrBadge}
              onPress={() => setShowQRModal(true)}
            >
              <Ionicons name="qr-code" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.fullName}>{user?.fullName || "User"}</Text>
          <View style={styles.raazIdBox}>
            <Text style={styles.raazIdText}>{raazId}</Text>
          </View>

          <Text style={styles.bioText}>{user?.bio || "Hey there! I am using SmileyX."}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qrBtn}
              onPress={() => setShowQRModal(true)}
            >
              <Ionicons name="qr-code-outline" size={18} color={SAFFRON} />
              <Text style={styles.qrBtnText}>My QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= REALYOU SPACES ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles" size={20} color={Palette.primaryBlue} />
            <Text style={styles.sectionTitle}>RealYou Spaces</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Switch between your personal visibility spaces
          </Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            {["Public Me", "Friends Me", "Just Me"].map((space, idx) => (
              <TouchableOpacity
                key={space}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: Radii.md,
                  backgroundColor: idx === 0 ? Palette.primaryBlue : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: idx === 0 ? Palette.primaryBlue : Palette.borderLight,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: idx === 0 ? "#FFFFFF" : Palette.secondaryTextLight,
                  }}
                >
                  {space}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ================= PROFILE SECTIONS ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="grid-outline" size={20} color={Palette.primaryBlue} />
            <Text style={styles.sectionTitle}>Content Spaces</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {[
              { id: "moments", label: "Moments", icon: "images" },
              { id: "loops", label: "Loops", icon: "videocam" },
              { id: "keepsakes", label: "Keepsakes", icon: "bookmark" },
              { id: "capsules", label: "LifeCapsule", icon: "hourglass" },
            ].map((sec) => (
              <TouchableOpacity
                key={sec.id}
                style={{
                  width: "47%",
                  backgroundColor: "#F8FAFF",
                  borderRadius: Radii.lg,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: Palette.borderLight,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => router.push("/(tabs)/home")}
              >
                <Ionicons name={sec.icon as any} size={18} color={Palette.primaryBlue} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: Palette.primaryTextLight }}>
                  {sec.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ================= FEELINGS MODE ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="heart" size={20} color="#EC4899" />
            <Text style={styles.sectionTitle}>Feelings Mode</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Share how you are feeling with friends today. Private by default.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.moodPill,
                  selectedMood === m.id && styles.moodPillActive,
                ]}
                onPress={() => handleSelectMood(m.id)}
              >
                <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    selectedMood === m.id && styles.moodLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ================= GHOST MODE & PRIVACY ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="eye-off" size={20} color={SAFFRON} />
            <Text style={styles.sectionTitle}>Ghost Mode & Privacy</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Fine-tune presence visibility and quiet hours.
          </Text>

          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Ghost Mode (Master Switch)</Text>
              <Text style={styles.settingDesc}>
                Instantly hides online presence, typing, and last seen from everyone.
              </Text>
            </View>
            <Switch
              value={ghostMode}
              onValueChange={handleToggleGhostMode}
              trackColor={{ false: "#EADFD6", true: SAFFRON }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Read Receipts</Text>
              <Text style={styles.settingDesc}>
                Show blue checkmarks when messages are read.
              </Text>
            </View>
            <Switch
              value={showReadReceipts}
              onValueChange={async (v) => {
                setShowReadReceipts(v);
                await UserAPI.updatePrivacy({ showReadReceipts: v });
              }}
              trackColor={{ false: "#EADFD6", true: SAFFRON }}
            />
          </View>
        </View>

        {/* ================= ACCOUNT SETTINGS ================= */}
        <View style={styles.sectionCard}>
          {(user?.role === "admin" || user?.role === "super_admin") && (
            <TouchableOpacity
              style={[styles.navRow, { backgroundColor: "#FFF2E2", borderRadius: 12, paddingHorizontal: 12, marginVertical: 4 }]}
              onPress={() => router.push("/admin" as any)}
            >
              <Ionicons name="shield-checkmark" size={22} color={SAFFRON} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.navRowText, { color: SAFFRON, fontWeight: "800" }]}>
                  Super Admin Control Center
                </Text>
                <Text style={{ fontSize: 11, color: "#888" }}>
                  Platform CRUD, Users, Moderation, Settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={SAFFRON} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#555" />
            <Text style={styles.navRowText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color="#C4B9AD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push("/(tabs)/contacts")}
          >
            <Ionicons name="people-outline" size={20} color="#555" />
            <Text style={styles.navRowText}>Contacts & Blocked Users</Text>
            <Ionicons name="chevron-forward" size={18} color="#C4B9AD" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={[styles.navRowText, { color: "#DC2626" }]}>Log Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#C4B9AD" />
          </TouchableOpacity>
        </View>

        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>SmileyX v2.0 • Your Moments. Your Feelings. Your World.</Text>
        </View>
      </ScrollView>

      {/* ================= QR CODE MODAL ================= */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.qrModalTitle}>Your SmileyX QR</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close-circle" size={26} color="#777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.qrModalDesc}>
              Friends can scan this QR code to connect with you directly.
            </Text>

            <View style={styles.qrBox}>
              <QRCode
                value={`smileyx://user/${user?.username || "smiley"}`}
                size={200}
                color={SAFFRON}
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={styles.qrId}>{raazId}</Text>
          </View>
        </View>
      </Modal>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <Modal visible={showEditModal} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={26} color="#252525" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>About / Bio</Text>
            <TextInput
              style={[styles.modalInput, { height: 90 }]}
              multiline
              maxLength={200}
              value={editBio}
              onChangeText={setEditBio}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.qrModalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close-circle" size={26} color="#777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity style={styles.actionBtn} onPress={handleChangePassword}>
              <Text style={styles.actionBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
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
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    padding: 18,
    paddingBottom: 60,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3E8DE",
    elevation: 3,
    marginBottom: 16,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FDEEE0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "900",
    color: SAFFRON,
  },
  qrBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: SAFFRON,
    padding: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  fullName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#252525",
    marginTop: 12,
  },
  raazIdBox: {
    backgroundColor: "rgba(255, 122, 0, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  raazIdText: {
    color: SAFFRON,
    fontWeight: "800",
    fontSize: 13,
  },
  bioText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  editBtn: {
    backgroundColor: SAFFRON,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  editBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  qrBtn: {
    backgroundColor: "#FFF9F2",
    borderWidth: 1,
    borderColor: SAFFRON,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  qrBtnText: {
    color: SAFFRON,
    fontWeight: "800",
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F3E8DE",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#252525",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9F2",
    borderWidth: 1,
    borderColor: "#EADFD6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  moodPillActive: {
    backgroundColor: "#FCE7F3",
    borderColor: "#EC4899",
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  moodLabelActive: {
    color: "#BE185D",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FAF4ED",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#252525",
  },
  settingDesc: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
    paddingRight: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FAF4ED",
    gap: 12,
  },
  navRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  versionFooter: {
    alignItems: "center",
    marginTop: 10,
  },
  versionText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#252525",
  },
  qrModalDesc: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginVertical: 10,
  },
  qrBox: {
    padding: 16,
    backgroundColor: "#FFF9F2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EADFD6",
    marginVertical: 10,
  },
  qrId: {
    fontSize: 16,
    fontWeight: "800",
    color: SAFFRON,
    marginTop: 6,
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
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#252525",
  },
  saveBtn: {
    backgroundColor: SAFFRON,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: "#FFF9F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EADFD6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  actionBtn: {
    backgroundColor: SAFFRON,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 16,
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
});