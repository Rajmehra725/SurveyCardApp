import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PostAPI,
  VibeAPI,
  MoodAPI,
  FriendAPI,
  NotificationAPI,
} from "../../services/api";
import { Palette, Radii, Shadows, Spacing } from "../../constants/theme";
import { SmileyXLogo } from "../../components/ui/smileyx-logo";

const { width } = Dimensions.get("window");

const MOODS_LIST = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "loved", label: "Loved", emoji: "🥰" },
  { id: "chill", label: "Chill", emoji: "☕" },
  { id: "excited", label: "Excited", emoji: "⚡" },
  { id: "grateful", label: "Grateful", emoji: "🙏" },
  { id: "thoughtful", label: "Thoughtful", emoji: "🤔" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "sad", label: "Sad", emoji: "🥺" },
];

const EMOJI_REACTIONS = ["❤️", "🔥", "😂", "👏", "😮", "🙏"];

export default function HomeScreen() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [feedFilter, setFeedFilter] = useState<"for_you" | "latest" | "friends">("for_you");

  // Vibes & Stories
  const [vibes, setVibes] = useState<any[]>([]);
  const [activeVibe, setActiveVibe] = useState<any>(null);

  // Moments Posts Feed
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // MoodSpace Daily Pulse
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [moodNote, setMoodNote] = useState<string>("");
  const [moodIsPrivate, setMoodIsPrivate] = useState<boolean>(true);
  const [moodSaving, setMoodSaving] = useState<boolean>(false);
  const [showMoodHistoryModal, setShowMoodHistoryModal] = useState<boolean>(false);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);

  // Comments Modal
  const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // Notifications badge
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, [feedFilter]);

  const loadInitialData = async () => {
    try {
      const userJson =
        (await AsyncStorage.getItem("smileyx_user")) ||
        (await AsyncStorage.getItem("raaz_user"));

      if (userJson) {
        const u = JSON.parse(userJson);
        setCurrentUser(u);
        if (u.currentMood?.mood) {
          setSelectedMood(u.currentMood.mood);
        }
      }

      await Promise.allSettled([
        loadFeed(),
        loadVibes(),
        loadNotificationsCount(),
      ]);
    } catch (e) {
      console.log("Home load error:", e);
    } finally {
      setLoadingPosts(false);
      setRefreshing(false);
    }
  };

  const loadFeed = async () => {
    try {
      const res = await PostAPI.getFeed(feedFilter);
      if (res.data?.success) {
        setPosts(res.data.posts || []);
      }
    } catch (e) {
      console.log("Feed fetch error:", e);
    }
  };

  const loadVibes = async () => {
    try {
      const res = await VibeAPI.getFeed();
      if (res.data?.success) {
        setVibes(res.data.moments || []);
      }
    } catch (e) {
      console.log("Vibes fetch error:", e);
    }
  };

  const loadNotificationsCount = async () => {
    try {
      const res = await NotificationAPI.getAll(1);
      if (res.data?.success) {
        setUnreadNotifs(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.log("Notifs fetch error:", e);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
  };

  // Handle Mood Recording
  const handleSelectMood = async (moodId: string) => {
    setSelectedMood(moodId);
    setMoodSaving(true);
    try {
      await MoodAPI.record({
        mood: moodId,
        note: moodNote.trim(),
        isPrivate: moodIsPrivate,
      });
      Alert.alert(
        "Feeling Saved ✨",
        moodIsPrivate
          ? "Logged in your private mood journal."
          : "Shared with your friends."
      );
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Could not save feeling.");
    } finally {
      setMoodSaving(false);
    }
  };

  const loadMoodHistory = async () => {
    setShowMoodHistoryModal(true);
    try {
      const res = await MoodAPI.getHistory(30);
      if (res.data?.success) {
        setMoodHistory(res.data.history || []);
      }
    } catch (e) {
      console.log("Mood history error:", e);
    }
  };

  // Handle Post Reactions
  const handleReactPost = async (postId: string, emoji = "❤️") => {
    try {
      const res = await PostAPI.react(postId, emoji);
      if (res.data?.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, reactions: res.data.reactions } : p
          )
        );
      }
    } catch (e: any) {
      Alert.alert("Notice", e.response?.data?.message || "Could not react to post.");
    }
  };

  // Handle Poll Voting
  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const res = await PostAPI.votePoll(postId, optionId);
      if (res.data?.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, poll: res.data.poll } : p
          )
        );
      }
    } catch (e: any) {
      Alert.alert("Poll Notice", e.response?.data?.message || "Could not vote on poll.");
    }
  };

  // Handle Comments Modal
  const openComments = async (post: any) => {
    setActiveCommentPost(post);
    setLoadingComments(true);
    try {
      const res = await PostAPI.getComments(post._id);
      if (res.data?.success) {
        setComments(res.data.comments || []);
      }
    } catch (e) {
      console.log("Comments error:", e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !activeCommentPost) return;
    try {
      const res = await PostAPI.addComment(activeCommentPost._id, commentText.trim());
      if (res.data?.success) {
        setComments((prev) => [...prev, res.data.comment]);
        setCommentText("");
        setPosts((prev) =>
          prev.map((p) =>
            p._id === activeCommentPost._id
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
              : p
          )
        );
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Could not send comment.");
    }
  };

  // Save / Bookmark Post
  const handleToggleSavePost = async (postId: string) => {
    try {
      const res = await PostAPI.toggleSave(postId);
      if (res.data?.success) {
        Alert.alert("Collections", res.data.message);
      }
    } catch (e: any) {
      Alert.alert("Notice", e.response?.data?.message || "Could not save post.");
    }
  };

  // Share Post
  const handleSharePost = async (post: any) => {
    try {
      await Share.share({
        message: `${post.user?.fullName} on SmileyX: "${post.text || "Check this Moment!"}"`,
      });
    } catch (e) {
      console.log("Share error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ================= A. HEADER ================= */}
      <View style={styles.topHeader}>
        <View style={styles.brandingRow}>
          <SmileyXLogo size={36} showText={false} />
          <Text style={styles.headerBrandTitle}>
            Smiley<Text style={{ color: Palette.primaryBlue }}>X</Text>
          </Text>
        </View>

        <View style={styles.headerIconsRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/discover")}
          >
            <Ionicons name="search-outline" size={22} color={Palette.primaryTextLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/discover")}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Palette.primaryTextLight}
            />
            {unreadNotifs > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfileButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/profile")}
          >
            {currentUser?.profileImage ? (
              <Image
                source={{ uri: currentUser.profileImage }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarInitials}>
                  {currentUser?.fullName?.charAt(0) || "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Palette.primaryBlue]}
          />
        }
      >
        {/* ================= B. VIBES CAROUSEL ================= */}
        <View style={styles.vibesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vibesScroll}
          >
            {/* User's Add Vibe Action */}
            <TouchableOpacity
              style={styles.vibeItem}
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/moments")}
            >
              <View style={styles.addVibeRing}>
                {currentUser?.profileImage ? (
                  <Image
                    source={{ uri: currentUser.profileImage }}
                    style={styles.vibeAvatar}
                  />
                ) : (
                  <View style={[styles.vibeAvatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitials}>
                      {currentUser?.fullName?.charAt(0) || "+"}
                    </Text>
                  </View>
                )}
                <View style={styles.addVibeBadge}>
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.vibeName} numberOfLines={1}>
                Your Vibe
              </Text>
            </TouchableOpacity>

            {/* Friends' Vibes */}
            {vibes.map((v) => (
              <TouchableOpacity
                key={v._id}
                style={styles.vibeItem}
                activeOpacity={0.85}
                onPress={() => setActiveVibe(v)}
              >
                <View style={styles.vibeRingActive}>
                  {v.user?.profileImage ? (
                    <Image
                      source={{ uri: v.user.profileImage }}
                      style={styles.vibeAvatar}
                    />
                  ) : (
                    <View style={[styles.vibeAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitials}>
                        {v.user?.fullName?.charAt(0) || "F"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.vibeName} numberOfLines={1}>
                  {v.user?.fullName?.split(" ")[0] || "Friend"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ================= C. MOODSPACE: FEELINGS & DAILY PULSE ================= */}
        <View style={styles.moodSpaceCard}>
          <View style={styles.moodSpaceHeader}>
            <View style={styles.moodSpaceTitleRow}>
              <Text style={styles.moodSpaceTitle}>MoodSpace</Text>
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={11} color={Palette.primaryBlue} />
                <Text style={styles.privateBadgeText}>Private by Default</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={loadMoodHistory}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="journal-outline" size={16} color={Palette.primaryBlue} />
              <Text style={styles.historyBtnText}>Journal</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.moodSpaceSubtitle}>
            How are you feeling right now? Select your pulse:
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodsScroll}
          >
            {MOODS_LIST.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moodChip,
                    isSelected && styles.moodChipSelected,
                  ]}
                  onPress={() => handleSelectMood(m.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && styles.moodLabelSelected,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedMood ? (
            <View style={styles.moodNoteRow}>
              <TextInput
                style={styles.moodNoteInput}
                placeholder="Optional private note on this feeling..."
                placeholderTextColor="#94A3B8"
                value={moodNote}
                onChangeText={setMoodNote}
              />
              <TouchableOpacity
                style={styles.moodPrivacyToggle}
                onPress={() => setMoodIsPrivate(!moodIsPrivate)}
              >
                <Ionicons
                  name={moodIsPrivate ? "lock-closed" : "people"}
                  size={16}
                  color={Palette.primaryBlue}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* ================= D. QUICK CREATE STUDIO ================= */}
        <View style={styles.quickCreateRow}>
          <TouchableOpacity
            style={styles.quickCreateBtn}
            onPress={() => router.push("/(tabs)/create")}
            activeOpacity={0.85}
          >
            <View style={[styles.quickCreateIcon, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
              <Ionicons name="images-outline" size={18} color={Palette.primaryBlue} />
            </View>
            <Text style={styles.quickCreateLabel}>Moment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCreateBtn}
            onPress={() => router.push("/(tabs)/moments")}
            activeOpacity={0.85}
          >
            <View style={[styles.quickCreateIcon, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
              <Ionicons name="sparkles-outline" size={18} color={Palette.skyBlue} />
            </View>
            <Text style={styles.quickCreateLabel}>Vibe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCreateBtn}
            onPress={() => router.push("/time-capsule" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.quickCreateIcon, { backgroundColor: "rgba(6, 182, 212, 0.12)" }]}>
              <Ionicons name="hourglass-outline" size={18} color={Palette.accentCyan} />
            </View>
            <Text style={styles.quickCreateLabel}>TimeDrop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCreateBtn}
            onPress={() => router.push("/secret-room" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.quickCreateIcon, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
              <Ionicons name="key-outline" size={18} color={Palette.warning} />
            </View>
            <Text style={styles.quickCreateLabel}>Secret</Text>
          </TouchableOpacity>
        </View>

        {/* ================= E. MOMENTS FEED TABS ================= */}
        <View style={styles.feedTabsRow}>
          <TouchableOpacity
            style={[
              styles.feedTab,
              feedFilter === "for_you" && styles.feedTabActive,
            ]}
            onPress={() => setFeedFilter("for_you")}
          >
            <Text
              style={[
                styles.feedTabText,
                feedFilter === "for_you" && styles.feedTabTextActive,
              ]}
            >
              For You
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedTab,
              feedFilter === "latest" && styles.feedTabActive,
            ]}
            onPress={() => setFeedFilter("latest")}
          >
            <Text
              style={[
                styles.feedTabText,
                feedFilter === "latest" && styles.feedTabTextActive,
              ]}
            >
              Latest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedTab,
              feedFilter === "friends" && styles.feedTabActive,
            ]}
            onPress={() => setFeedFilter("friends")}
          >
            <Text
              style={[
                styles.feedTabText,
                feedFilter === "friends" && styles.feedTabTextActive,
              ]}
            >
              Friends Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= MOMENTS FEED LIST ================= */}
        {loadingPosts ? (
          <ActivityIndicator color={Palette.primaryBlue} style={{ marginVertical: 30 }} />
        ) : posts.length > 0 ? (
          <View style={styles.postsList}>
            {posts.map((post) => {
              const userLiked = post.reactions?.some(
                (r: any) => r.user?._id === currentUser?._id || r.user === currentUser?._id
              );
              return (
                <View key={post._id} style={styles.postCard}>
                  {/* Post Header */}
                  <View style={styles.postCardHeader}>
                    <View style={styles.postAuthorInfo}>
                      {post.user?.profileImage ? (
                        <Image
                          source={{ uri: post.user.profileImage }}
                          style={styles.postAuthorAvatar}
                        />
                      ) : (
                        <View style={styles.postAuthorAvatarFallback}>
                          <Text style={styles.postAuthorInitials}>
                            {post.user?.fullName?.charAt(0) || "U"}
                          </Text>
                        </View>
                      )}
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.postAuthorName}>{post.user?.fullName}</Text>
                        <View style={styles.postSubMeta}>
                          <Text style={styles.postUsername}>@{post.user?.username}</Text>
                          {post.feeling ? (
                            <Text style={styles.postFeelingTag}>
                              {" "}• feeling {post.feeling}
                            </Text>
                          ) : null}
                          {post.location ? (
                            <Text style={styles.postLocationTag}>
                              {" "}📍 {post.location}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleToggleSavePost(post._id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={
                          post.savedBy?.includes(currentUser?._id)
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={20}
                        color={Palette.primaryBlue}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Post Text */}
                  {post.text ? (
                    <Text style={styles.postCaption}>{post.text}</Text>
                  ) : null}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 ? (
                    <View style={styles.hashtagsRow}>
                      {post.hashtags.map((h: string, idx: number) => (
                        <Text key={idx} style={styles.hashtagText}>
                          #{h}{" "}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {/* Post Media (Images/Videos) */}
                  {post.media && post.media.length > 0 ? (
                    <View style={styles.postMediaContainer}>
                      {post.media.map((m: any, idx: number) => (
                        <Image
                          key={idx}
                          source={{ uri: m.url }}
                          style={styles.postImage}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  ) : null}

                  {/* Poll if present */}
                  {post.poll && post.poll.options?.length > 0 ? (
                    <View style={styles.pollContainer}>
                      <Text style={styles.pollQuestion}>{post.poll.question}</Text>
                      {post.poll.options.map((opt: any) => {
                        const totalVotes = post.poll.options.reduce(
                          (acc: number, o: any) => acc + (o.votes?.length || 0),
                          0
                        );
                        const pct =
                          totalVotes > 0
                            ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100)
                            : 0;
                        const hasVoted = opt.votes?.some(
                          (v: any) => v.toString() === currentUser?._id
                        );

                        return (
                          <TouchableOpacity
                            key={opt._id}
                            style={[
                              styles.pollOptionBtn,
                              hasVoted && styles.pollOptionVoted,
                            ]}
                            onPress={() => handleVotePoll(post._id, opt._id)}
                          >
                            <View
                              style={[
                                styles.pollProgressFill,
                                { width: `${pct}%` },
                              ]}
                            />
                            <View style={styles.pollOptionContent}>
                              <Text style={styles.pollOptionText}>{opt.text}</Text>
                              <Text style={styles.pollOptionPct}>{pct}%</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Post Actions Bar */}
                  <View style={styles.postActionsBar}>
                    <View style={styles.postActionsLeft}>
                      {/* React Button */}
                      <TouchableOpacity
                        style={styles.actionBtnItem}
                        onPress={() => handleReactPost(post._id, "❤️")}
                      >
                        <Ionicons
                          name={userLiked ? "heart" : "heart-outline"}
                          size={22}
                          color={userLiked ? Palette.error : Palette.primaryTextLight}
                        />
                        <Text style={styles.actionCount}>
                          {post.reactions?.length || 0}
                        </Text>
                      </TouchableOpacity>

                      {/* Comments Button */}
                      <TouchableOpacity
                        style={styles.actionBtnItem}
                        onPress={() => openComments(post)}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={20}
                          color={Palette.primaryTextLight}
                        />
                        <Text style={styles.actionCount}>
                          {post.commentsCount || 0}
                        </Text>
                      </TouchableOpacity>

                      {/* Share Button */}
                      <TouchableOpacity
                        style={styles.actionBtnItem}
                        onPress={() => handleSharePost(post)}
                      >
                        <Ionicons
                          name="share-social-outline"
                          size={20}
                          color={Palette.primaryTextLight}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.postTimestamp}>
                      {new Date(post.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyFeedCard}>
            <Ionicons name="sparkles-outline" size={40} color={Palette.primaryBlue} />
            <Text style={styles.emptyFeedTitle}>Welcome to Your Feed!</Text>
            <Text style={styles.emptyFeedSubtitle}>
              Share a moment, express a feeling, or connect with friends to see updates here.
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => router.push("/(tabs)/create")}
            >
              <Text style={styles.emptyCreateBtnText}>Create First Moment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ================= VIBE VIEWER MODAL ================= */}
      <Modal visible={!!activeVibe} transparent animationType="fade">
        <View style={styles.vibeModalOverlay}>
          <SafeAreaView style={styles.vibeModalContent}>
            <View style={styles.vibeModalHeader}>
              <View style={styles.vibeModalAuthor}>
                <Image
                  source={{ uri: activeVibe?.user?.profileImage || "https://placehold.co/100" }}
                  style={styles.vibeModalAvatar}
                />
                <Text style={styles.vibeModalAuthorName}>
                  {activeVibe?.user?.fullName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveVibe(null)}>
                <Ionicons name="close-circle" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.vibeCardDisplay,
                { backgroundColor: activeVibe?.backgroundColor || Palette.primaryBlue },
              ]}
            >
              {activeVibe?.mediaUrl ? (
                <Image
                  source={{ uri: activeVibe.mediaUrl }}
                  style={styles.vibeMediaImg}
                  resizeMode="cover"
                />
              ) : null}
              {activeVibe?.text ? (
                <Text style={styles.vibeDisplayText}>{activeVibe.text}</Text>
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ================= COMMENTS MODAL ================= */}
      <Modal visible={!!activeCommentPost} animationType="slide">
        <SafeAreaView style={styles.commentsModalContainer}>
          <View style={styles.commentsModalHeader}>
            <Text style={styles.commentsModalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setActiveCommentPost(null)}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
          </View>

          {loadingComments ? (
            <ActivityIndicator color={Palette.primaryBlue} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
            >
              {comments.length > 0 ? (
                comments.map((c) => (
                  <View key={c._id} style={styles.commentItem}>
                    <View style={styles.commentAvatarFallback}>
                      <Text style={styles.commentInitials}>
                        {c.user?.fullName?.charAt(0) || "U"}
                      </Text>
                    </View>
                    <View style={styles.commentBody}>
                      <Text style={styles.commentUserName}>{c.user?.fullName}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noCommentsText}>
                  No comments yet. Be the first to express a thought!
                </Text>
              )}
            </ScrollView>
          )}

          {/* Comment Input */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a thoughtful comment..."
              placeholderTextColor="#94A3B8"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              style={styles.commentSendBtn}
              onPress={handleSendComment}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ================= MOOD JOURNAL MODAL ================= */}
      <Modal visible={showMoodHistoryModal} animationType="slide">
        <SafeAreaView style={styles.commentsModalContainer}>
          <View style={styles.commentsModalHeader}>
            <View>
              <Text style={styles.commentsModalTitle}>MoodSpace Journal</Text>
              <Text style={styles.journalSubtitle}>
                Your private daily feelings & emotional check-ins
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowMoodHistoryModal(false)}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.commentsList}>
            {moodHistory.map((m) => (
              <View key={m._id} style={styles.moodHistoryItem}>
                <Text style={styles.moodHistoryEmoji}>
                  {MOODS_LIST.find((item) => item.id === m.mood)?.emoji || "✨"}
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.moodHistoryLabel}>
                    Feeling {m.mood.charAt(0).toUpperCase() + m.mood.slice(1)}
                  </Text>
                  {m.note ? (
                    <Text style={styles.moodHistoryNote}>{m.note}</Text>
                  ) : null}
                  <Text style={styles.moodHistoryDate}>
                    {new Date(m.date).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingBottom: 40,
    backgroundColor: Palette.lightBg,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  brandingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBrandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Palette.primaryTextLight,
    letterSpacing: -0.3,
  },
  headerIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Palette.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  headerProfileButton: {
    marginLeft: 2,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarInitials: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  vibesContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  vibesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  vibeItem: {
    alignItems: "center",
    width: 68,
  },
  addVibeRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: Palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  vibeRingActive: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.brandGlow,
  },
  vibeAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarPlaceholder: {
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "800",
    color: Palette.secondaryTextLight,
  },
  addVibeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Palette.primaryBlue,
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  vibeName: {
    fontSize: 11,
    color: Palette.primaryTextLight,
    marginTop: 6,
    fontWeight: "600",
  },
  moodSpaceCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadows.sm,
  },
  moodSpaceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moodSpaceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodSpaceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  privateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  privateBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Palette.primaryBlue,
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.primaryBlue,
  },
  moodSpaceSubtitle: {
    fontSize: 12,
    color: Palette.secondaryTextLight,
    marginTop: 6,
    marginBottom: 10,
  },
  moodsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  moodChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.lg,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    minWidth: 64,
  },
  moodChipSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    borderColor: Palette.primaryBlue,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Palette.secondaryTextLight,
    marginTop: 4,
  },
  moodLabelSelected: {
    color: Palette.primaryBlue,
    fontWeight: "800",
  },
  moodNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  moodNoteInput: {
    flex: 1,
    fontSize: 12,
    color: Palette.primaryTextLight,
    paddingVertical: 8,
  },
  moodPrivacyToggle: {
    padding: 6,
  },
  quickCreateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  quickCreateBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.lg,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadows.sm,
  },
  quickCreateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickCreateLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.primaryTextLight,
  },
  feedTabsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: "#E2E8F0",
    borderRadius: Radii.lg,
    padding: 3,
  },
  feedTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: Radii.md,
  },
  feedTabActive: {
    backgroundColor: "#FFFFFF",
    ...Shadows.sm,
  },
  feedTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.secondaryTextLight,
  },
  feedTabTextActive: {
    color: Palette.primaryBlue,
  },
  postsList: {
    marginTop: 14,
    gap: 14,
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadows.sm,
  },
  postCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  postAuthorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAuthorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  postAuthorAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  postAuthorInitials: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  postSubMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  postUsername: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
  },
  postFeelingTag: {
    fontSize: 11,
    color: Palette.accentCyan,
    fontWeight: "600",
  },
  postLocationTag: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
  },
  postCaption: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.primaryTextLight,
    marginBottom: 8,
  },
  hashtagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  hashtagText: {
    fontSize: 12,
    color: Palette.primaryBlue,
    fontWeight: "700",
  },
  postMediaContainer: {
    borderRadius: Radii.lg,
    overflow: "hidden",
    marginVertical: 8,
  },
  postImage: {
    width: "100%",
    height: 240,
    borderRadius: Radii.lg,
  },
  pollContainer: {
    backgroundColor: "#F8FAFF",
    borderRadius: Radii.lg,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  pollQuestion: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.primaryTextLight,
    marginBottom: 8,
  },
  pollOptionBtn: {
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    justifyContent: "center",
    marginBottom: 6,
    position: "relative",
    overflow: "hidden",
  },
  pollOptionVoted: {
    borderColor: Palette.primaryBlue,
  },
  pollProgressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  pollOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 1,
  },
  pollOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.primaryTextLight,
  },
  pollOptionPct: {
    fontSize: 12,
    fontWeight: "800",
    color: Palette.primaryBlue,
  },
  postActionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  actionBtnItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.primaryTextLight,
  },
  postTimestamp: {
    fontSize: 11,
    color: "#94A3B8",
  },
  emptyFeedCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: Radii.xxl,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadows.sm,
  },
  emptyFeedTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Palette.primaryTextLight,
    marginTop: 12,
  },
  emptyFeedSubtitle: {
    fontSize: 13,
    color: Palette.secondaryTextLight,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyCreateBtn: {
    backgroundColor: Palette.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.lg,
    marginTop: 18,
    ...Shadows.brandGlow,
  },
  emptyCreateBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  vibeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  vibeModalContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
  },
  vibeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  vibeModalAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vibeModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  vibeModalAuthorName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  vibeCardDisplay: {
    flex: 1,
    marginVertical: 20,
    borderRadius: Radii.xxl,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    overflow: "hidden",
  },
  vibeMediaImg: {
    width: "100%",
    height: "100%",
  },
  vibeDisplayText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 32,
  },
  commentsModalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  commentsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Palette.primaryTextLight,
  },
  journalSubtitle: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  commentInitials: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  commentBody: {
    flex: 1,
    backgroundColor: "#F8FAFF",
    borderRadius: Radii.md,
    padding: 10,
  },
  commentUserName: {
    fontSize: 12,
    fontWeight: "800",
    color: Palette.primaryTextLight,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: Palette.primaryTextLight,
  },
  noCommentsText: {
    textAlign: "center",
    color: Palette.secondaryTextLight,
    marginTop: 30,
    fontSize: 13,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
    backgroundColor: "#FFFFFF",
  },
  commentInput: {
    flex: 1,
    height: 44,
    borderRadius: Radii.lg,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Palette.primaryTextLight,
  },
  commentSendBtn: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  moodHistoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F8FAFF",
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginBottom: 10,
  },
  moodHistoryEmoji: {
    fontSize: 30,
  },
  moodHistoryLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  moodHistoryNote: {
    fontSize: 12,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
  moodHistoryDate: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 4,
  },
});