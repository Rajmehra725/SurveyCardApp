import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ChatAPI } from "../../services/api";

import { Palette, Radii, Shadows } from "../../constants/theme";

const PRIMARY_BLUE = Palette.primaryBlue;
const BG_LIGHT = Palette.lightBg;

export default function ChatsScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await ChatAPI.getConversations();
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (e) {
      console.log("Fetch chats error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const filtered = conversations.filter((c) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "unread"
        ? c.unreadCount > 0
        : c.type === "group" || c.type === "circle";

    const matchesSearch =
      !search.trim() ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessageText?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const renderChatItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item._id}` as any)}
      >
        <View style={styles.avatarWrapper}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {item.title ? item.title.charAt(0).toUpperCase() : "C"}
              </Text>
            </View>
          )}
          {item.otherUser?.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>
              {item.lastMessageAt
                ? new Date(item.lastMessageAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.message,
                item.unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessageText || "No messages yet"}
            </Text>

            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>Your Space. Your Conversations.</Text>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/discover")}
        >
          <Ionicons name="create-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          placeholder="Search chats or messages..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === "all" && styles.filterBtnActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === "unread" && styles.filterBtnActive]}
          onPress={() => setFilter("unread")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "unread" && styles.filterTextActive,
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === "groups" && styles.filterBtnActive]}
          onPress={() => setFilter("groups")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "groups" && styles.filterTextActive,
            ]}
          >
            Circles & Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {loading ? (
        <ActivityIndicator color={PRIMARY_BLUE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_BLUE]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyText}>No chats found</Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => router.push("/(tabs)/discover")}
              >
                <Text style={styles.startBtnText}>Start New Chat</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PRIMARY_BLUE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchBox: {
    marginHorizontal: 18,
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#252525",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  filterBtnActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  filterText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 100,
  },
  chatItem: {
    minHeight: 74,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(37, 99, 235, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY_BLUE,
  },
  onlineDot: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#16A34A",
    right: -1,
    bottom: -1,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    color: "#94A3B8",
  },
  bottomRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
  },
  unreadMessage: {
    color: "#111827",
    fontWeight: "700",
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    marginLeft: 8,
    borderRadius: 9,
    backgroundColor: PRIMARY_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
    marginTop: 10,
  },
  startBtn: {
    marginTop: 16,
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});