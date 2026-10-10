import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UserAPI, FriendAPI, ChatAPI, PostAPI } from "../../services/api";
import { Palette, Radii, Shadows, Spacing } from "../../constants/theme";

const POPULAR_HASHTAGS = [
  "SmileyMoments",
  "BlueJayVibes",
  "DailyFeelings",
  "Photography",
  "MusicLovers",
  "TechLife",
  "ArtAndDesign",
  "WeekendVibes",
];

const COMMUNITY_TOPICS = [
  { id: "friends", label: "Friends & Besties", icon: "people", count: "1.2k" },
  { id: "college", label: "Campus & College", icon: "school", count: "850" },
  { id: "coding", label: "Developers & Creators", icon: "code-slash", count: "2.4k" },
  { id: "music", label: "Music & Beats", icon: "musical-notes", count: "3.1k" },
];

export default function DiscoverScreen() {
  const [activeTab, setActiveTab] = useState<"people" | "trending" | "communities">("people");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<{ [key: string]: boolean }>({});
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  useEffect(() => {
    if (activeTab === "trending") {
      fetchTrending();
    }
  }, [activeTab]);

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await PostAPI.getFeed("trending", 1);
      if (res.data?.success) {
        setTrendingPosts(res.data.posts || []);
      }
    } catch (e) {
      console.log("Trending fetch error:", e);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await UserAPI.search(text.trim());
      if (res.data?.success) {
        setSearchResults(res.data.users || []);
      }
    } catch (e) {
      console.log("Search error:", e);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      const res = await FriendAPI.sendRequest(userId);
      if (res.data?.success) {
        setSentRequests((prev) => ({ ...prev, [userId]: true }));
        Alert.alert("Request Sent! 🤝", "Friend request sent successfully.");
      }
    } catch (err: any) {
      Alert.alert("Notice", err.response?.data?.message || "Could not send friend request.");
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const res = await ChatAPI.getOrCreateDirect(userId);
      if (res.data?.success && res.data.conversation) {
        router.push(`/chat/${res.data.conversation._id}` as any);
      }
    } catch (err: any) {
      Alert.alert("Notice", err.response?.data?.message || "Could not start chat.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Find People, Vibes, and Moments</Text>
        </View>

        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push("/(tabs)/home")}
        >
          <Ionicons name="sparkles" size={20} color={Palette.primaryBlue} />
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Palette.primaryBlue} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people by @username or name..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            value={query}
            onChangeText={handleSearch}
          />
          {query ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Discover Tabs */}
      <View style={styles.tabsRow}>
        {[
          { id: "people", label: "People" },
          { id: "trending", label: "Trending" },
          { id: "communities", label: "Circles" },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === t.id && styles.tabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TAB 1: PEOPLE (SEARCH RESULTS & DISCOVERY) */}
        {activeTab === "people" && (
          <View>
            {searching ? (
              <ActivityIndicator color={Palette.primaryBlue} style={{ marginTop: 20 }} />
            ) : searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                <Text style={styles.sectionHeading}>Search Results</Text>
                {searchResults.map((u) => {
                  const reqSent = sentRequests[u._id];
                  return (
                    <View key={u._id} style={styles.userCard}>
                      <View style={styles.userCardLeft}>
                        {u.profileImage ? (
                          <Image source={{ uri: u.profileImage }} style={styles.avatar} />
                        ) : (
                          <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitials}>
                              {u.fullName?.charAt(0) || "U"}
                            </Text>
                          </View>
                        )}
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{u.fullName}</Text>
                          <Text style={styles.userHandle}>@{u.username}</Text>
                          {u.bio ? (
                            <Text style={styles.userBio} numberOfLines={1}>
                              {u.bio}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.userActionsRow}>
                        <TouchableOpacity
                          style={styles.chatActionBtn}
                          onPress={() => handleStartChat(u._id)}
                        >
                          <Ionicons name="chatbubble-outline" size={16} color={Palette.primaryBlue} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.friendActionBtn,
                            reqSent && styles.friendActionBtnSent,
                          ]}
                          onPress={() => handleSendRequest(u._id)}
                          disabled={reqSent}
                        >
                          <Ionicons
                            name={reqSent ? "checkmark" : "person-add"}
                            size={14}
                            color="#FFFFFF"
                          />
                          <Text style={styles.friendActionBtnText}>
                            {reqSent ? "Sent" : "Add"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : query.trim() ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No Users Found</Text>
                <Text style={styles.emptyStateDesc}>
                  Try searching with a different name or @username.
                </Text>
              </View>
            ) : (
              <View>
                {/* Popular Hashtags */}
                <Text style={styles.sectionHeading}>Trending Topics</Text>
                <View style={styles.hashtagsGrid}>
                  {POPULAR_HASHTAGS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={styles.hashtagPill}
                      onPress={() => handleSearch(h)}
                    >
                      <Text style={styles.hashtagPillText}>#{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Friendly Tip */}
                <View style={styles.tipCard}>
                  <Ionicons name="shield-checkmark" size={24} color={Palette.primaryBlue} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.tipCardTitle}>Privacy by Design</Text>
                    <Text style={styles.tipCardDesc}>
                      Personal phone numbers and private mood entries are never exposed in search or recommendations.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: TRENDING MOMENTS */}
        {activeTab === "trending" && (
          <View>
            {loadingTrending ? (
              <ActivityIndicator color={Palette.primaryBlue} style={{ marginTop: 20 }} />
            ) : trendingPosts.length > 0 ? (
              <View style={styles.trendingList}>
                {trendingPosts.map((post) => (
                  <View key={post._id} style={styles.trendingCard}>
                    <View style={styles.trendingHeader}>
                      <Text style={styles.trendingAuthor}>{post.user?.fullName}</Text>
                      <Text style={styles.trendingReactions}>
                        🔥 {post.reactions?.length || 0} reactions
                      </Text>
                    </View>
                    {post.text ? (
                      <Text style={styles.trendingText}>{post.text}</Text>
                    ) : null}
                    {post.media && post.media.length > 0 ? (
                      <Image
                        source={{ uri: post.media[0].url }}
                        style={styles.trendingImg}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="flame-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No Trending Moments</Text>
                <Text style={styles.emptyStateDesc}>
                  Share moments with your circle to light up trending topics!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: CIRCLES & COMMUNITIES */}
        {activeTab === "communities" && (
          <View style={styles.circlesList}>
            <Text style={styles.sectionHeading}>Community Circles</Text>
            {COMMUNITY_TOPICS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.circleItem}
                activeOpacity={0.8}
                onPress={() => router.push("/(tabs)/chats")}
              >
                <View style={styles.circleIconBox}>
                  <Ionicons name={c.icon as any} size={22} color={Palette.primaryBlue} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.circleLabel}>{c.label}</Text>
                  <Text style={styles.circleCount}>{c.count} members active</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.lightBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: Palette.primaryTextLight,
  },
  subtitle: {
    fontSize: 12,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  searchBox: {
    height: 46,
    borderRadius: Radii.lg,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Palette.primaryTextLight,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: "#F1F5F9",
  },
  tabActive: {
    backgroundColor: Palette.primaryBlue,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.secondaryTextLight,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: Palette.primaryTextLight,
    marginBottom: 12,
  },
  resultsList: {
    gap: 10,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.sm,
  },
  userCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  userHandle: {
    fontSize: 12,
    color: Palette.primaryBlue,
    fontWeight: "600",
  },
  userBio: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
  userActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  friendActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Palette.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  friendActionBtnSent: {
    backgroundColor: Palette.success,
  },
  friendActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Palette.primaryTextLight,
    marginTop: 10,
  },
  emptyStateDesc: {
    fontSize: 12,
    color: Palette.secondaryTextLight,
    textAlign: "center",
    marginTop: 4,
  },
  hashtagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  hashtagPill: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  hashtagPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.primaryBlue,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    padding: 16,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.15)",
  },
  tipCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.primaryBlue,
  },
  tipCardDesc: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
    marginTop: 2,
    lineHeight: 16,
  },
  trendingList: {
    gap: 12,
  },
  trendingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadows.sm,
  },
  trendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  trendingAuthor: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  trendingReactions: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.error,
  },
  trendingText: {
    fontSize: 13,
    color: Palette.primaryTextLight,
    marginBottom: 8,
  },
  trendingImg: {
    width: "100%",
    height: 180,
    borderRadius: Radii.lg,
  },
  circlesList: {
    gap: 10,
  },
  circleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadows.sm,
  },
  circleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  circleCount: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
});