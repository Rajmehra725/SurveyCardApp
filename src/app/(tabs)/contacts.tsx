import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FriendAPI, ChatAPI } from "../../services/api";
import { Palette } from "../../constants/theme";

const SAFFRON = Palette.primaryBlue;
const BG_WARM = Palette.lightBg;

export default function ContactsScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await FriendAPI.getAll();
      if (res.data?.success) {
        setFriends(res.data.friends || []);
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      }
    } catch (e) {
      console.log("Fetch friends error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartChat = async (friendId: string) => {
    try {
      const res = await ChatAPI.getOrCreateDirect(friendId);
      if (res.data?.success && res.data.conversation) {
        router.push(`/chat/${res.data.conversation._id}` as any);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not open chat");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await FriendAPI.acceptRequest(requestId);
      Alert.alert("Connected!", "Friend request accepted.");
      fetchFriends();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to accept");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendAPI.rejectRequest(requestId);
      fetchFriends();
    } catch (err: any) {
      console.log("Reject error:", err);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      !search.trim() ||
      f.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      f.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Contacts</Text>
          <Text style={styles.subtitle}>Your Connections on SmileyX</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(tabs)/discover")}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs: Friends vs Requests */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "friends" && styles.tabBtnActive]}
          onPress={() => setActiveTab("friends")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "friends" && styles.tabTextActive,
            ]}
          >
            My Friends ({friends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "requests" && styles.tabBtnActive]}
          onPress={() => setActiveTab("requests")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "requests" && styles.tabTextActive,
            ]}
          >
            Requests ({incoming.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "friends" ? (
        <>
          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              placeholder="Filter by name or @username..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator color={SAFFRON} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item._id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchFriends();
                  }}
                  colors={[SAFFRON]}
                />
              }
              renderItem={({ item }) => (
                <View style={styles.contactItem}>
                  <View style={styles.avatarWrap}>
                    {item.profileImage ? (
                      <Image
                        source={{ uri: item.profileImage }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>
                          {item.fullName?.charAt(0) || "U"}
                        </Text>
                      </View>
                    )}
                    {item.isOnline && <View style={styles.onlineDot} />}
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.contactName}>{item.fullName}</Text>
                    <Text style={styles.contactUsername}>@{item.username}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.chatActionBtn}
                    onPress={() => handleStartChat(item._id)}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color={SAFFRON} />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="people-outline" size={44} color="#C4B9AD" />
                  <Text style={styles.emptyText}>No friends added yet</Text>
                  <TouchableOpacity
                    style={styles.findBtn}
                    onPress={() => router.push("/(tabs)/discover")}
                  >
                    <Text style={styles.findBtnText}>Discover People</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </>
      ) : (
        /* Requests Tab */
        <ScrollView style={{ padding: 18 }}>
          <Text style={styles.reqSectionTitle}>Incoming Requests</Text>
          {incoming.length > 0 ? (
            incoming.map((req) => (
              <View key={req._id} style={styles.reqCard}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {req.sender?.fullName?.charAt(0) || "U"}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactName}>{req.sender?.fullName}</Text>
                  <Text style={styles.contactUsername}>@{req.sender?.username}</Text>
                </View>

                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptRequest(req._id)}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleRejectRequest(req._id)}
                >
                  <Ionicons name="close" size={18} color="#777" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noReqText}>No pending incoming requests</Text>
          )}

          <Text style={[styles.reqSectionTitle, { marginTop: 24 }]}>
            Sent Requests
          </Text>
          {outgoing.length > 0 ? (
            outgoing.map((req) => (
              <View key={req._id} style={styles.reqCard}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {req.recipient?.fullName?.charAt(0) || "U"}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactName}>{req.recipient?.fullName}</Text>
                  <Text style={styles.contactUsername}>
                    @{req.recipient?.username}
                  </Text>
                </View>
                <Text style={styles.pendingBadge}>Pending</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReqText}>No pending sent requests</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_WARM,
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
    borderBottomColor: "#F3E8DE",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#252525",
  },
  subtitle: {
    fontSize: 12,
    color: "#777",
    fontWeight: "500",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: SAFFRON,
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3E8DE",
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
  searchBox: {
    marginHorizontal: 18,
    marginVertical: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADFD6",
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
  contactItem: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginBottom: 8,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FDEEE0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "800",
    color: SAFFRON,
  },
  onlineDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#16A34A",
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#252525",
  },
  contactUsername: {
    fontSize: 12,
    color: SAFFRON,
    fontWeight: "600",
    marginTop: 2,
  },
  chatActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF3E6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
    marginTop: 10,
  },
  findBtn: {
    marginTop: 14,
    backgroundColor: SAFFRON,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  findBtnText: {
    color: "#FFF",
    fontWeight: "800",
  },
  reqSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#252525",
    marginBottom: 10,
  },
  reqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  acceptBtn: {
    backgroundColor: SAFFRON,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  acceptText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
  },
  rejectBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#F3E8DE",
  },
  pendingBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noReqText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 10,
  },
});