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

  const smileyId = user?.username ? `@${user.username}` : "@user";

  const handleDeletePost = async (postId: string) => {
    Alert.alert("Delete Moment", "Are you sure you want to delete this moment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await PostAPI.delete(postId);
            setUserPosts((prev) => prev.filter((p) => p._id !== postId));
            setShowPostModal(false);
            Alert.alert("Deleted", "Your moment has been deleted.");
          } catch (e: any) {
            Alert.alert("Error", e.response?.data?.message || "Could not delete moment");
          }
        },
      },
    ]);
  };

  const handleClearCache = async () => {
    Alert.alert("Clear Cache", "Clear temporary cached media and local session cache?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear Cache",
        onPress: () => {
          Alert.alert("Cache Cleared", "Temporary cache has been cleared successfully.");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= TOP BAR WITH HAMBURGER MENU ================= */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.topBarTitle}>My Space</Text>
          {user?.isProfilePrivate && (
            <View style={styles.privateBadge}>
              <Ionicons name="lock-closed" size={11} color="#FFFFFF" />
              <Text style={styles.privateBadgeText}>Private</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={() => setShowSettingsModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.raazIdText}>{smileyId}</Text>
          </View>

          <Text style={styles.bioText}>{user?.bio || "Hey there! I am using SmileyX."}</Text>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Moments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{user?.friendsCount || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {selectedMood ? selectedMood.toUpperCase() : "CHILL"}
              </Text>
              <Text style={styles.statLabel}>Mood</Text>
            </View>
          </View>

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

        {/* ================= FEELINGS MODE ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="heart" size={20} color="#EC4899" />
            <Text style={styles.sectionTitle}>Feelings Mode</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Share how you are feeling today. Private by default.
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

        {/* ================= USER'S PUBLISHED CONTENT TABS ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.contentTabsHeader}>
            {[
              { id: "moments", label: `Moments (${userPosts.length})`, icon: "images" },
              { id: "loops", label: "Loops", icon: "videocam" },
              { id: "keepsakes", label: "Keepsakes", icon: "bookmark" },
              { id: "capsules", label: "LifeCapsule", icon: "hourglass" },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.contentTabBtn,
                  activeTab === t.id && styles.contentTabBtnActive,
                ]}
                onPress={() => setActiveTab(t.id as any)}
              >
                <Ionicons
                  name={t.icon as any}
                  size={15}
                  color={activeTab === t.id ? Palette.primaryBlue : Palette.secondaryTextLight}
                />
                <Text
                  style={[
                    styles.contentTabBtnText,
                    activeTab === t.id && styles.contentTabBtnTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB CONTENT */}
          {activeTab === "moments" && (
            <View style={{ marginTop: 14 }}>
              {postsLoading ? (
                <ActivityIndicator color={Palette.primaryBlue} style={{ paddingVertical: 20 }} />
              ) : userPosts.length > 0 ? (
                <View style={styles.userPostsList}>
                  {userPosts.map((post) => (
                    <TouchableOpacity
                      key={post._id}
                      style={styles.userPostCard}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedPost(post);
                        setShowPostModal(true);
                      }}
                    >
                      <View style={styles.userPostHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {Boolean(post.feeling) && (
                            <View style={styles.feelingBadge}>
                              <Text style={styles.feelingBadgeText}>{post.feeling}</Text>
                            </View>
                          )}
                          <Text style={styles.userPostTime}>
                            {new Date(post.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        </View>
                        <Text style={styles.audienceTag}>{post.audience}</Text>
                      </View>

                      {Boolean(post.text) && (
                        <Text style={styles.userPostText} numberOfLines={3}>
                          {post.text}
                        </Text>
                      )}

                      {post.media && post.media.length > 0 && (
                        <Image
                          source={{ uri: post.media[0].url }}
                          style={styles.userPostMedia}
                          resizeMode="cover"
                        />
                      )}

                      {/* Poll Preview */}
                      {post.poll && post.poll.question && (
                        <View style={styles.pollPreviewBox}>
                          <Ionicons name="bar-chart" size={16} color={Palette.primaryBlue} />
                          <Text style={styles.pollPreviewText} numberOfLines={1}>
                            Poll: {post.poll.question}
                          </Text>
                        </View>
                      )}

                      <View style={styles.userPostFooter}>
                        <View style={styles.postStatItem}>
                          <Ionicons name="heart" size={16} color="#EC4899" />
                          <Text style={styles.postStatText}>{post.reactions?.length || 0}</Text>
                        </View>
                        <View style={styles.postStatItem}>
                          <Ionicons name="chatbubble-outline" size={15} color={Palette.secondaryTextLight} />
                          <Text style={styles.postStatText}>{post.commentsCount || 0}</Text>
                        </View>
                        <View style={styles.postStatItem}>
                          <Ionicons name="bookmark-outline" size={15} color={Palette.secondaryTextLight} />
                          <Text style={styles.postStatText}>{post.saveCount || 0}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyPostsCard}>
                  <Ionicons name="sparkles-outline" size={40} color={Palette.primaryBlue} />
                  <Text style={styles.emptyPostsTitle}>No Moments Published Yet</Text>
                  <Text style={styles.emptyPostsDesc}>
                    Capture a moment, share a feeling, or start a poll to share your world.
                  </Text>
                  <TouchableOpacity
                    style={styles.createMomentBtn}
                    onPress={() => router.push("/(tabs)/create")}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.createMomentBtnText}>Create Moment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab !== "moments" && (
            <View style={styles.emptyPostsCard}>
              <Ionicons name="cube-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyPostsTitle}>
                {activeTab === "loops"
                  ? "No Loops Shared"
                  : activeTab === "keepsakes"
                  ? "No Keepsakes Saved"
                  : "LifeCapsule Ready"}
              </Text>
              <Text style={styles.emptyPostsDesc}>
                {activeTab === "loops"
                  ? "Short video loops will appear here."
                  : activeTab === "keepsakes"
                  ? "Save your favorite moments to revisit anytime."
                  : "Preserve memories for your future self."}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>SmileyX v2.0 • Your Moments. Your Feelings. Your World.</Text>
        </View>
      </ScrollView>

      {/* ================= SEPARATE SETTINGS HAMBURGER MODAL (SECTIONS A TO H) ================= */}
      <Modal visible={showSettingsModal} animationType="slide">
        <SafeAreaView style={styles.settingsModalSafe}>
          {/* Settings Modal Header */}
          <View style={styles.settingsModalHeader}>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.settingsModalTitle}>Settings & Privacy</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsModalContent}>
            {/* SECTION A: ACCOUNT */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Account</Text>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowEditModal(true);
                }}
              >
                <Ionicons name="person-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Personal Information</Text>
                  <Text style={styles.settingsRowDesc}>{user?.email || "Update name, bio, and avatar"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.settingsRow}>
                <Ionicons name="lock-closed-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Private Account</Text>
                  <Text style={styles.settingsRowDesc}>Only approved friends can view your moments</Text>
                </View>
                <Switch
                  value={user?.isProfilePrivate || false}
                  onValueChange={async (val) => {
                    setUser((prev: any) => ({ ...prev, isProfilePrivate: val }));
                    await UserAPI.updatePrivacy({ isProfilePrivate: val });
                  }}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => Alert.alert("Deactivate Account", "Contact safety@smileyx.app to process account deactivation.")}
              >
                <Ionicons name="pause-circle-outline" size={20} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.settingsRowTitle, { color: "#DC2626" }]}>Deactivate Account</Text>
                  <Text style={styles.settingsRowDesc}>Temporarily suspend your SmileyX presence</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* SECTION B: PRIVACY */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Privacy & Visibility</Text>

              <View style={styles.settingsRow}>
                <Ionicons name="eye-off-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Ghost Mode (Master Switch)</Text>
                  <Text style={styles.settingsRowDesc}>Hides online presence, typing status, and last seen</Text>
                </View>
                <Switch
                  value={ghostMode}
                  onValueChange={handleToggleGhostMode}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <View style={styles.settingsRow}>
                <Ionicons name="radio-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Online Status</Text>
                  <Text style={styles.settingsRowDesc}>Allow friends to see when you are active</Text>
                </View>
                <Switch
                  value={showOnline}
                  onValueChange={async (v) => {
                    setShowOnline(v);
                    await UserAPI.updatePrivacy({ showOnline: v });
                  }}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <View style={styles.settingsRow}>
                <Ionicons name="time-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Last Seen</Text>
                  <Text style={styles.settingsRowDesc}>Display timestamp of last session</Text>
                </View>
                <Switch
                  value={showLastSeen}
                  onValueChange={async (v) => {
                    setShowLastSeen(v);
                    await UserAPI.updatePrivacy({ showLastSeen: v });
                  }}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <View style={styles.settingsRow}>
                <Ionicons name="checkmark-done-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Read Receipts</Text>
                  <Text style={styles.settingsRowDesc}>Show blue ticks when messages are opened</Text>
                </View>
                <Switch
                  value={showReadReceipts}
                  onValueChange={async (v) => {
                    setShowReadReceipts(v);
                    await UserAPI.updatePrivacy({ showReadReceipts: v });
                  }}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => {
                  setShowSettingsModal(false);
                  router.push("/(tabs)/contacts");
                }}
              >
                <Ionicons name="ban-outline" size={20} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Blocked Accounts</Text>
                  <Text style={styles.settingsRowDesc}>Manage blocked friends and contacts</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* SECTION C: NOTIFICATIONS */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Notifications</Text>

              <View style={styles.settingsRow}>
                <Ionicons name="notifications-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Push Notifications</Text>
                  <Text style={styles.settingsRowDesc}>Receive alerts on lock screen</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <View style={styles.settingsRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Message Alerts</Text>
                  <Text style={styles.settingsRowDesc}>Sound & banner for incoming messages</Text>
                </View>
                <Switch
                  value={msgNotifs}
                  onValueChange={setMsgNotifs}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <View style={styles.settingsRow}>
                <Ionicons name="moon-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Quiet Hours (No Disturb)</Text>
                  <Text style={styles.settingsRowDesc}>Mute non-essential notifications overnight</Text>
                </View>
                <Switch
                  value={quietHours}
                  onValueChange={setQuietHours}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>
            </View>

            {/* SECTION D: CHAT SETTINGS */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Chat Settings</Text>

              <View style={styles.settingsRow}>
                <Ionicons name="cloud-download-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Media Auto-Download</Text>
                  <Text style={styles.settingsRowDesc}>Automatically download photos on Wi-Fi</Text>
                </View>
                <Switch
                  value={mediaAutoDownload}
                  onValueChange={setMediaAutoDownload}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>

              <View style={styles.settingsRow}>
                <Ionicons name="timer-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Disappearing Messages</Text>
                  <Text style={styles.settingsRowDesc}>Enable automatic 24h ephemeral chats</Text>
                </View>
                <Switch
                  value={disappearingMessages}
                  onValueChange={setDisappearingMessages}
                  trackColor={{ false: "#E2E8F0", true: Palette.primaryBlue }}
                />
              </View>
            </View>

            {/* SECTION E: APPEARANCE */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Appearance & Theme</Text>

              <View style={{ flexDirection: "row", gap: 10, marginVertical: 8 }}>
                {[
                  { id: "light", label: "Light", icon: "sunny" },
                  { id: "dark", label: "Dark", icon: "moon" },
                  { id: "system", label: "System", icon: "phone-portrait" },
                ].map((th) => (
                  <TouchableOpacity
                    key={th.id}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: Radii.lg,
                      borderWidth: 2,
                      borderColor: themeMode === th.id ? Palette.primaryBlue : Palette.borderLight,
                      backgroundColor: themeMode === th.id ? "#EFF6FF" : "#FFFFFF",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onPress={() => setThemeMode(th.id as any)}
                  >
                    <Ionicons
                      name={th.icon as any}
                      size={20}
                      color={themeMode === th.id ? Palette.primaryBlue : Palette.secondaryTextLight}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: themeMode === th.id ? Palette.primaryBlue : Palette.secondaryTextLight,
                      }}
                    >
                      {th.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.settingsRowDesc}>Established Blue Jay Visual Theme active.</Text>
            </View>

            {/* SECTION F: SECURITY */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Security & Access</Text>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowPasswordModal(true);
                }}
              >
                <Ionicons name="key-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Change Password</Text>
                  <Text style={styles.settingsRowDesc}>Update your account security credential</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {(user?.role === "admin" || user?.role === "super_admin") && (
                <TouchableOpacity
                  style={[styles.settingsRow, { backgroundColor: "#FFF7ED", borderRadius: Radii.md, padding: 8 }]}
                  onPress={() => {
                    setShowSettingsModal(false);
                    router.push("/admin" as any);
                  }}
                >
                  <Ionicons name="shield-checkmark" size={22} color={Palette.primaryBlue} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.settingsRowTitle, { color: Palette.primaryBlue, fontWeight: "800" }]}>
                      Super Admin Control Center
                    </Text>
                    <Text style={styles.settingsRowDesc}>Platform metrics, user moderation & audit logs</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Palette.primaryBlue} />
                </TouchableOpacity>
              )}
            </View>

            {/* SECTION G: DATA AND STORAGE */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Data & Storage</Text>

              <TouchableOpacity style={styles.settingsRow} onPress={handleClearCache}>
                <Ionicons name="trash-bin-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Clear Cache</Text>
                  <Text style={styles.settingsRowDesc}>Free temporary disk space without losing posts</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* SECTION H: SUPPORT AND INFORMATION */}
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupHeading}>Support & Legal</Text>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => Alert.alert("SmileyX Platform", "SmileyX v2.0 • Your Moments. Your Feelings. Your World.\n\nAll Rights Reserved.")}
              >
                <Ionicons name="information-circle-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>About SmileyX</Text>
                  <Text style={styles.settingsRowDesc}>Version 2.0 • Blue Jay Release</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => Alert.alert("Privacy & Terms", "By using SmileyX, you agree to our Terms of Service and Privacy Policy. Phone numbers and private feelings are never sold.")}
              >
                <Ionicons name="document-text-outline" size={20} color={Palette.primaryBlue} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Terms & Privacy Policy</Text>
                  <Text style={styles.settingsRowDesc}>Platform safety rules & community standards</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsRow, { marginTop: 10 }]}
                onPress={() => {
                  setShowSettingsModal(false);
                  handleLogout();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.settingsRowTitle, { color: "#DC2626", fontWeight: "800" }]}>Log Out</Text>
                  <Text style={styles.settingsRowDesc}>Securely end your current device session</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ================= POST DETAILS & ACTION MODAL ================= */}
      <Modal visible={showPostModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.postDetailCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.postDetailTitle}>Moment Details</Text>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <Ionicons name="close-circle" size={26} color="#777" />
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {Boolean(selectedPost.feeling) && (
                  <View style={[styles.feelingBadge, { alignSelf: "flex-start", marginBottom: 10 }]}>
                    <Text style={styles.feelingBadgeText}>{selectedPost.feeling}</Text>
                  </View>
                )}

                {Boolean(selectedPost.text) && (
                  <Text style={{ fontSize: 16, color: "#111827", lineHeight: 22, marginBottom: 12 }}>
                    {selectedPost.text}
                  </Text>
                )}

                {selectedPost.media && selectedPost.media.length > 0 && (
                  <Image
                    source={{ uri: selectedPost.media[0].url }}
                    style={{ width: "100%", height: 220, borderRadius: Radii.lg, marginBottom: 14 }}
                    resizeMode="cover"
                  />
                )}

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0" }}>
                  <Text style={{ fontSize: 13, color: "#64748B" }}>
                    🔥 {selectedPost.reactions?.length || 0} reactions • 💬 {selectedPost.commentsCount || 0} comments
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#FEE2E2", borderRadius: Radii.md }}
                    onPress={() => handleDeletePost(selectedPost._id)}
                  >
                    <Ionicons name="trash" size={16} color="#DC2626" />
                    <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "700" }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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