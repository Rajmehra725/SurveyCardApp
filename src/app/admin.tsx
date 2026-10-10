import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Switch,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AdminAPI, AuthAPI } from "../services/api";
import { Palette } from "../constants/theme";

const SAFFRON = Palette.primaryBlue;
const BG_WARM = Palette.lightBg;

type AdminTab =
  | "metrics"
  | "users"
  | "groups"
  | "moments"
  | "reports"
  | "notifications"
  | "settings"
  | "audit"
  | "cards";

export default function SuperAdminScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>("metrics");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Module data states
  const [metrics, setMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [moments, setMoments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("pending");
  const [notifStatusFilter, setNotifStatusFilter] = useState("all");

  // User Action Modal
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editVerified, setEditVerified] = useState(false);

  // Group Create / Action Modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupCategory, setGroupCategory] = useState("general");
  const [groupType, setGroupType] = useState<"group" | "circle">("group");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Notification Create Modal
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifPriority, setNotifPriority] = useState<"normal" | "important" | "critical">("normal");
  const [notifAudience, setNotifAudience] = useState("all");
  const [notifIsDraft, setNotifIsDraft] = useState(false);

  // Report Resolution Modal
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionNote, setActionNote] = useState("");

  useEffect(() => {
    verifyAdminAuth();
  }, []);

  useEffect(() => {
    if (!authError && currentUser) {
      loadTabData(activeTab);
    }
  }, [activeTab, userStatusFilter, reportStatusFilter, notifStatusFilter]);

  const verifyAdminAuth = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const profileRes = await AuthAPI.getProfile();
      if (!profileRes.data?.success) {
        setAuthError("Unauthorized: Session is not authenticated.");
        setLoading(false);
        return;
      }

      const user = profileRes.data.user;
      setCurrentUser(user);

      // Verify backend rejects unauthorized role
      if (user.role !== "admin" && user.role !== "super_admin") {
        setAuthError(
          "Access Denied: Super Admin & Administrator Privileges Required. Your role does not grant access to this panel."
        );
        setLoading(false);
        return;
      }

      await loadTabData("metrics");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Backend Authorization Failed: Super Admin privileges required.";
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: AdminTab) => {
    try {
      if (tab === "metrics") {
        const [mRes, aRes] = await Promise.all([
          AdminAPI.getMetrics(),
          AdminAPI.getAnalytics().catch(() => ({ data: { analytics: null } })),
        ]);
        if (mRes.data?.success) setMetrics(mRes.data.metrics);
        if (aRes.data?.analytics) setAnalytics(aRes.data.analytics);
      } else if (tab === "users") {
        const res = await AdminAPI.getUsers({
          search: searchQuery,
          status: userStatusFilter === "all" ? "" : userStatusFilter,
        });
        if (res.data?.success) setUsers(res.data.users || []);
      } else if (tab === "groups") {
        const res = await AdminAPI.getGroups({ search: searchQuery });
        if (res.data?.success) setGroups(res.data.groups || []);
      } else if (tab === "moments") {
        const res = await AdminAPI.getMoments();
        if (res.data?.success) setMoments(res.data.moments || []);
      } else if (tab === "reports") {
        const res = await AdminAPI.getReports({
          status: reportStatusFilter === "all" ? "" : reportStatusFilter,
        });
        if (res.data?.success) setReports(res.data.reports || []);
      } else if (tab === "notifications") {
        const res = await AdminAPI.getNotifications({
          status: notifStatusFilter === "all" ? "" : notifStatusFilter,
        });
        if (res.data?.success) setNotifications(res.data.notifications || []);
      } else if (tab === "settings") {
        const res = await AdminAPI.getSettings();
        if (res.data?.success) setSettings(res.data.settings || []);
      } else if (tab === "audit") {
        const res = await AdminAPI.getAuditLogs();
        if (res.data?.success) setAuditLogs(res.data.logs || []);
      } else if (tab === "cards") {
        const res = await AdminAPI.getCards();
        if (res.data?.success) setCards(res.data.cards || []);
      }
    } catch (err: any) {
      console.log(`Error loading tab ${tab}:`, err?.response?.data || err.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTabData(activeTab);
    setRefreshing(false);
  };

  // ---------------- USER CRUD HANDLERS ----------------
  const openUserEdit = (user: any) => {
    setSelectedUser(user);
    setEditFullName(user.fullName || "");
    setEditBio(user.bio || "");
    setEditVerified(Boolean(user.isVerified));
    setShowUserModal(true);
  };

  const handleSaveUserProfile = async () => {
    if (!selectedUser) return;
    try {
      const res = await AdminAPI.updateUser(selectedUser._id, {
        fullName: editFullName,
        bio: editBio,
        isVerified: editVerified,
      });
      if (res.data?.success) {
        Alert.alert("Success", "User profile updated.");
        setShowUserModal(false);
        loadTabData("users");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to update profile");
    }
  };

  const handleToggleSuspend = async () => {
    if (!selectedUser) return;
    try {
      const res = await AdminAPI.suspendUser(
        selectedUser._id,
        "Moderation action from Super Admin panel"
      );
      if (res.data?.success) {
        Alert.alert("Success", res.data.message);
        setShowUserModal(false);
        loadTabData("users");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to suspend user");
    }
  };

  const handleToggleBan = async () => {
    if (!selectedUser) return;
    try {
      const res = await AdminAPI.banUser(
        selectedUser._id,
        "Safety standard enforcement"
      );
      if (res.data?.success) {
        Alert.alert("Success", res.data.message);
        setShowUserModal(false);
        loadTabData("users");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to ban user");
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!selectedUser) return;
    Alert.alert(
      "Confirm Role Change",
      `Are you sure you want to change @${selectedUser.username}'s role to ${newRole.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const res = await AdminAPI.changeUserRole(selectedUser._id, newRole);
              if (res.data?.success) {
                Alert.alert("Role Updated", res.data.message);
                setShowUserModal(false);
                loadTabData("users");
              }
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || "Failed to change role");
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    Alert.alert(
      "Permanent Deletion",
      `Are you sure you want to permanently delete @${selectedUser.username}? This action is irreversible and recorded in the audit trail.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await AdminAPI.deleteUser(selectedUser._id);
              if (res.data?.success) {
                Alert.alert("Deleted", res.data.message);
                setShowUserModal(false);
                loadTabData("users");
              }
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  // ---------------- GROUP CRUD HANDLERS ----------------
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Validation", "Group name is required.");
      return;
    }
    try {
      const res = await AdminAPI.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim(),
        category: groupCategory,
        type: groupType,
      });
      if (res.data?.success) {
        Alert.alert("Success", "New official group created.");
        setShowCreateGroupModal(false);
        setGroupName("");
        setGroupDesc("");
        loadTabData("groups");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to create group");
    }
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await AdminAPI.deleteGroup(groupId);
              if (res.data?.success) {
                Alert.alert("Success", res.data.message);
                setShowGroupModal(false);
                loadTabData("groups");
              }
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || "Failed to delete group");
            }
          },
        },
      ]
    );
  };

  // ---------------- MOMENTS MODERATION HANDLERS ----------------
  const handleDeleteMoment = (momentId: string) => {
    Alert.alert(
      "Moderate Moment",
      "Remove this story from the platform for community standards violation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove Story",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await AdminAPI.deleteMoment(momentId, "Moderation removal");
              if (res.data?.success) {
                Alert.alert("Success", "Moment removed.");
                loadTabData("moments");
              }
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || "Failed to remove moment");
            }
          },
        },
      ]
    );
  };

  // ---------------- NOTIFICATIONS CRUD HANDLERS ----------------
  const handleCreateNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      Alert.alert("Validation", "Title and message are required.");
      return;
    }
    try {
      const res = await AdminAPI.createNotification({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        priority: notifPriority,
        targetAudience: notifAudience,
        isDraft: notifIsDraft,
      });
      if (res.data?.success) {
        Alert.alert("Success", res.data.message);
        setShowNotifModal(false);
        setNotifTitle("");
        setNotifMessage("");
        loadTabData("notifications");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to post notification");
    }
  };

  const handleSendNotification = async (id: string) => {
    try {
      const res = await AdminAPI.sendNotification(id);
      if (res.data?.success) {
        Alert.alert("Broadcast Dispatched", res.data.message);
        loadTabData("notifications");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to dispatch");
    }
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert("Delete Campaign", "Delete this notification draft / entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await AdminAPI.deleteNotification(id);
            loadTabData("notifications");
          } catch (e: any) {
            Alert.alert("Error", e.response?.data?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  // ---------------- REPORT RESOLUTION HANDLERS ----------------
  const handleResolveReport = async (status: string, moderationAction = "") => {
    if (!selectedReport) return;
    try {
      const res = await AdminAPI.resolveReport(selectedReport._id, {
        status,
        actionNote: actionNote.trim(),
        moderationAction,
      });
      if (res.data?.success) {
        Alert.alert("Report Processed", res.data.message);
        setShowReportModal(false);
        setActionNote("");
        loadTabData("reports");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to resolve report");
    }
  };

  // ---------------- SETTINGS CRUD HANDLERS ----------------
  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const res = await AdminAPI.updateSetting(key, { value });
      if (res.data?.success) {
        Alert.alert("Saved", `Setting ${key} updated.`);
        loadTabData("settings");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to update setting");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={SAFFRON} />
        <Text style={styles.loadingText}>Verifying Super Admin Authorization...</Text>
      </SafeAreaView>
    );
  }

  if (authError) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="shield-outline" size={64} color="#DC2626" />
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorMessage}>{authError}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Return to App</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isSuperAdmin = currentUser?.role === "super_admin";

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#252525" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Super Admin Control</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={SAFFRON} />
        </TouchableOpacity>
      </View>

      {/* Module Horizontal Tab Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {[
            { key: "metrics", label: "Overview", icon: "stats-chart" },
            { key: "users", label: "Users", icon: "people" },
            { key: "groups", label: "Groups", icon: "chatbubbles" },
            { key: "moments", label: "Moments", icon: "images" },
            { key: "reports", label: "Reports", icon: "alert-circle" },
            { key: "notifications", label: "Campaigns", icon: "megaphone" },
            { key: "settings", label: "Settings", icon: "settings" },
            { key: "audit", label: "Audit Logs", icon: "shield-checkmark" },
            { key: "cards", label: "CMS Cards", icon: "card" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key as AdminTab)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? "#FFFFFF" : "#777777"}
              />
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === tab.key && styles.tabItemTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SAFFRON]} />}
      >
        {/* TAB 1: METRICS & ANALYTICS */}
        {activeTab === "metrics" && metrics && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Platform Metrics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color={SAFFRON} />
                <Text style={styles.statValue}>{metrics.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={styles.statSub}>+{metrics.newRegistrations} this week</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="radio-outline" size={24} color="#16A34A" />
                <Text style={[styles.statValue, { color: "#16A34A" }]}>{metrics.activeUsers}</Text>
                <Text style={styles.statLabel}>Online Now</Text>
                <Text style={styles.statSub}>Real-time presence</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="chatbubbles-outline" size={24} color="#3B82F6" />
                <Text style={[styles.statValue, { color: "#3B82F6" }]}>{metrics.totalConversations}</Text>
                <Text style={styles.statLabel}>Conversations</Text>
                <Text style={styles.statSub}>{metrics.groupsAndCircles} groups</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="paper-plane-outline" size={24} color="#8B5CF6" />
                <Text style={[styles.statValue, { color: "#8B5CF6" }]}>{metrics.totalMessages}</Text>
                <Text style={styles.statLabel}>Messages Sent</Text>
                <Text style={styles.statSub}>Full persistence</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="warning-outline" size={24} color="#DC2626" />
                <Text style={[styles.statValue, { color: "#DC2626" }]}>{metrics.pendingReports}</Text>
                <Text style={styles.statLabel}>Pending Reports</Text>
                <Text style={styles.statSub}>Safety attention</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="flame-outline" size={24} color="#EA580C" />
                <Text style={[styles.statValue, { color: "#EA580C" }]}>{metrics.totalMoments}</Text>
                <Text style={styles.statLabel}>Active Moments</Text>
                <Text style={styles.statSub}>24h stories</Text>
              </View>
            </View>

            {/* Quick Actions Shortcuts */}
            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Quick Administrative Operations</Text>
            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  setActiveTab("users");
                  setUserStatusFilter("suspended");
                }}
              >
                <Ionicons name="person-remove-outline" size={20} color="#EA580C" />
                <Text style={styles.quickActionText}>Review Suspended ({metrics.suspendedUsers})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  setActiveTab("reports");
                  setReportStatusFilter("pending");
                }}
              >
                <Ionicons name="shield-outline" size={20} color="#DC2626" />
                <Text style={styles.quickActionText}>Resolve Reports ({metrics.pendingReports})</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 2: USERS MANAGEMENT (CRUD) */}
        {activeTab === "users" && (
          <View style={styles.tabContent}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#777" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, @username, or phone..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => loadTabData("users")}
              />
              <TouchableOpacity onPress={() => loadTabData("users")}>
                <Text style={styles.searchAction}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter Pills */}
            <View style={styles.filterPillsRow}>
              {["all", "active", "suspended", "banned"].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterPill, userStatusFilter === st && styles.filterPillActive]}
                  onPress={() => setUserStatusFilter(st)}
                >
                  <Text style={[styles.filterPillText, userStatusFilter === st && styles.filterPillTextActive]}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.countLabel}>Showing {users.length} accounts</Text>

            {users.map((u) => (
              <TouchableOpacity
                key={u._id}
                style={styles.userListItem}
                onPress={() => openUserEdit(u)}
                activeOpacity={0.8}
              >
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{u.fullName?.[0] || "U"}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.userName}>{u.fullName}</Text>
                    {u.isVerified && <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />}
                  </View>
                  <Text style={styles.userHandle}>@{u.username} • {u.phone}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.roleTag, u.role === "super_admin" && styles.superAdminTag]}>
                      <Text style={styles.roleTagText}>{u.role}</Text>
                    </View>
                    {u.isSuspended && <View style={styles.tagSuspended}><Text style={styles.tagText}>Suspended</Text></View>}
                    {u.isBanned && <View style={styles.tagBanned}><Text style={styles.tagText}>Banned</Text></View>}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#AAA" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TAB 3: GROUPS MANAGEMENT (CRUD) */}
        {activeTab === "groups" && (
          <View style={styles.tabContent}>
            <View style={styles.actionHeader}>
              <Text style={styles.sectionHeading}>Platform Circles & Groups</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setShowCreateGroupModal(true)}
              >
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.createBtnText}>Create Group</Text>
              </TouchableOpacity>
            </View>

            {groups.map((g) => (
              <View key={g._id} style={styles.groupCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: "#FFF3E6" }]}>
                    <Ionicons name={g.type === "circle" ? "radio-button-on" : "people"} size={20} color={SAFFRON} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.userName}>{g.name}</Text>
                    <Text style={styles.userHandle}>{g.category} • {g.participantsCount || 0} members</Text>
                  </View>
                </View>
                {Boolean(g.description) && (
                  <Text style={styles.groupDesc} numberOfLines={2}>{g.description}</Text>
                )}

                <View style={styles.groupCardActions}>
                  <TouchableOpacity
                    style={styles.cardDeleteBtn}
                    onPress={() => handleDeleteGroup(g._id, g.name)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={styles.cardDeleteText}>Delete Group</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: MOMENTS MODERATION */}
        {activeTab === "moments" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>24-Hour Moments Moderation</Text>
            {moments.length === 0 ? (
              <Text style={styles.emptyNotice}>No active stories posted.</Text>
            ) : (
              moments.map((m) => (
                <View key={m._id} style={styles.momentCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={styles.userName}>@{m.user?.username || "user"}</Text>
                    <Text style={styles.momentType}>Type: {m.type}</Text>
                  </View>
                  <Text style={styles.momentText}>{m.text || "[Media Story]"}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <Text style={styles.momentExpires}>
                      Views: {m.viewers?.length || 0} • Expires {new Date(m.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <TouchableOpacity
                      style={styles.cardDeleteBtn}
                      onPress={() => handleDeleteMoment(m._id)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={styles.cardDeleteText}>Moderate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 5: REPORTS & SAFETY */}
        {activeTab === "reports" && (
          <View style={styles.tabContent}>
            <View style={styles.filterPillsRow}>
              {["pending", "reviewed", "action_taken", "dismissed"].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterPill, reportStatusFilter === st && styles.filterPillActive]}
                  onPress={() => setReportStatusFilter(st)}
                >
                  <Text style={[styles.filterPillText, reportStatusFilter === st && styles.filterPillTextActive]}>
                    {st.replace("_", " ").toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {reports.map((r) => (
              <View key={r._id} style={styles.reportCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.reportTypeBadge}>TARGET: {r.targetType.toUpperCase()}</Text>
                  <Text style={[styles.tagText, { color: r.status === "pending" ? "#DC2626" : "#16A34A" }]}>
                    {r.status.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.reportReason}>Reason: {r.reason}</Text>
                {Boolean(r.details) && <Text style={styles.reportDetailsText}>Details: {r.details}</Text>}
                <Text style={styles.reportMeta}>
                  Reported by: @{r.reporter?.username || "anonymous"} • {new Date(r.createdAt).toLocaleDateString()}
                </Text>

                {r.status === "pending" && (
                  <TouchableOpacity
                    style={styles.resolveBtn}
                    onPress={() => {
                      setSelectedReport(r);
                      setShowReportModal(true);
                    }}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#FFF" />
                    <Text style={styles.resolveBtnText}>Review & Take Action</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* TAB 6: NOTIFICATIONS CRUD */}
        {activeTab === "notifications" && (
          <View style={styles.tabContent}>
            <View style={styles.actionHeader}>
              <Text style={styles.sectionHeading}>Notification Campaigns</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setShowNotifModal(true)}
              >
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.createBtnText}>New Campaign</Text>
              </TouchableOpacity>
            </View>

            {notifications.map((n) => (
              <View key={n._id} style={styles.notifCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.userName}>{n.title}</Text>
                  <View style={[styles.statusTag, n.status === "sent" ? styles.tagActive : styles.tagDraft]}>
                    <Text style={styles.tagText}>{n.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.notifMessage}>{n.message}</Text>
                <Text style={styles.notifMeta}>
                  Audience: {n.targetAudience} • Recipients: {n.recipientsCount || 0}
                </Text>

                <View style={styles.notifActions}>
                  {n.status !== "sent" && (
                    <TouchableOpacity
                      style={styles.sendNowBtn}
                      onPress={() => handleSendNotification(n._id)}
                    >
                      <Ionicons name="send" size={14} color="#FFF" />
                      <Text style={styles.sendNowText}>Send Broadcast</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.cardDeleteBtn}
                    onPress={() => handleDeleteNotification(n._id)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    <Text style={styles.cardDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 7: SETTINGS CRUD */}
        {activeTab === "settings" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Permitted System Settings</Text>
            {settings.map((s) => (
              <View key={s._id} style={styles.settingItem}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.settingKey}>{s.key}</Text>
                  <Text style={styles.settingDesc}>{s.description}</Text>
                </View>

                {s.type === "boolean" ? (
                  <Switch
                    value={Boolean(s.value)}
                    onValueChange={(val) => handleUpdateSetting(s.key, val)}
                    trackColor={{ false: "#DDD", true: SAFFRON }}
                  />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      style={styles.settingInput}
                      defaultValue={String(s.value)}
                      onSubmitEditing={(e) =>
                        handleUpdateSetting(
                          s.key,
                          s.type === "number" ? Number(e.nativeEvent.text) : e.nativeEvent.text
                        )
                      }
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* TAB 8: AUDIT LOGS */}
        {activeTab === "audit" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Platform Audit Trail</Text>
            {auditLogs.map((log) => (
              <View key={log._id} style={styles.auditCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.auditAction}>{log.action}</Text>
                  <Text style={styles.auditTime}>
                    {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <Text style={styles.auditAdmin}>
                  Admin: @{log.admin?.username || "admin"} ({log.admin?.role || "staff"})
                </Text>
                <Text style={styles.auditDetails}>
                  Target: {log.targetType} {log.targetId ? `(${log.targetId.slice(-6)})` : ""}
                </Text>
                {Boolean(log.ipAddress) && <Text style={styles.auditIp}>IP: {log.ipAddress}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* TAB 9: CMS CARDS */}
        {activeTab === "cards" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Survey Cards CMS</Text>
            {cards.map((c) => (
              <View key={c._id} style={styles.notifCard}>
                <Text style={styles.userName}>{c.name}</Text>
                <Text style={styles.userHandle}>Card: {c.cardNumber} • Status: {c.status}</Text>
                <Text style={styles.notifMeta}>District: {c.district}, {c.state}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* USER EDIT / MODERATION MODAL */}
      <Modal visible={showUserModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Account: @{selectedUser?.username}</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editFullName}
                onChangeText={setEditFullName}
              />

              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
              />

              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Verified Account Status</Text>
                <Switch
                  value={editVerified}
                  onValueChange={setEditVerified}
                  trackColor={{ false: "#DDD", true: SAFFRON }}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUserProfile}>
                <Text style={styles.saveBtnText}>Save Profile Updates</Text>
              </TouchableOpacity>

              <Text style={[styles.sectionHeading, { marginTop: 16, fontSize: 14 }]}>Moderation Controls</Text>
              <View style={styles.modActionRow}>
                <TouchableOpacity
                  style={[styles.modBtn, { backgroundColor: selectedUser?.isSuspended ? "#16A34A" : "#EA580C" }]}
                  onPress={handleToggleSuspend}
                >
                  <Text style={styles.modBtnText}>
                    {selectedUser?.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modBtn, { backgroundColor: selectedUser?.isBanned ? "#16A34A" : "#DC2626" }]}
                  onPress={handleToggleBan}
                >
                  <Text style={styles.modBtnText}>
                    {selectedUser?.isBanned ? "Unban Account" : "Ban Account"}
                  </Text>
                </TouchableOpacity>
              </View>

              {isSuperAdmin && (
                <>
                  <Text style={[styles.sectionHeading, { marginTop: 16, fontSize: 14 }]}>
                    Role Assignment (Super Admin Only)
                  </Text>
                  <View style={styles.roleBtnRow}>
                    {["user", "moderator", "admin", "super_admin"].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.roleSelectBtn,
                          selectedUser?.role === r && styles.roleSelectBtnActive,
                        ]}
                        onPress={() => handleChangeRole(r)}
                      >
                        <Text
                          style={[
                            styles.roleSelectText,
                            selectedUser?.role === r && styles.roleSelectTextActive,
                          ]}
                        >
                          {r.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.deleteUserBtn} onPress={handleDeleteUser}>
                    <Ionicons name="trash" size={16} color="#DC2626" />
                    <Text style={styles.deleteUserBtnText}>Permanently Delete User</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE GROUP MODAL */}
      <Modal visible={showCreateGroupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Official Group</Text>
              <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
                <Ionicons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. RaazChat Announcements"
              value={groupName}
              onChangeText={setGroupName}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              placeholder="Official circle topic..."
              value={groupDesc}
              onChangeText={setGroupDesc}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateGroup}>
              <Text style={styles.saveBtnText}>Create Official Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CREATE NOTIFICATION MODAL */}
      <Modal visible={showNotifModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Campaign / Announcement</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <Ionicons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Campaign Title"
              value={notifTitle}
              onChangeText={setNotifTitle}
            />

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, { height: 80 }]}
              placeholder="Platform notification body..."
              value={notifMessage}
              onChangeText={setNotifMessage}
              multiline
            />

            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>Save as Draft (Do not broadcast now)</Text>
              <Switch
                value={notifIsDraft}
                onValueChange={setNotifIsDraft}
                trackColor={{ false: "#DDD", true: SAFFRON }}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateNotification}>
              <Text style={styles.saveBtnText}>
                {notifIsDraft ? "Save Draft" : "Broadcast to All Users"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REPORT RESOLVE MODAL */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Report</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportReason}>Reason: {selectedReport?.reason}</Text>

            <Text style={styles.inputLabel}>Action Note (Audit Record)</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              placeholder="Notes on resolution..."
              value={actionNote}
              onChangeText={setActionNote}
              multiline
            />

            <View style={{ gap: 8, marginTop: 10 }}>
              {selectedReport?.targetType === "user" && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: "#DC2626" }]}
                  onPress={() => handleResolveReport("action_taken", "suspend_user")}
                >
                  <Text style={styles.saveBtnText}>Suspend Reported User</Text>
                </TouchableOpacity>
              )}

              {selectedReport?.targetType === "message" && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: "#DC2626" }]}
                  onPress={() => handleResolveReport("action_taken", "delete_content")}
                >
                  <Text style={styles.saveBtnText}>Redact / Remove Message</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#16A34A" }]}
                onPress={() => handleResolveReport("reviewed")}
              >
                <Text style={styles.saveBtnText}>Mark Resolved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#777777" }]}
                onPress={() => handleResolveReport("dismissed")}
              >
                <Text style={styles.saveBtnText}>Dismiss Report</Text>
              </TouchableOpacity>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: BG_WARM,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#DC2626",
    marginTop: 14,
  },
  errorMessage: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: SAFFRON,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3E8DE",
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#252525",
  },
  roleBadge: {
    backgroundColor: "#FFF3E6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SAFFRON,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: SAFFRON,
  },
  refreshBtn: {
    padding: 6,
  },
  tabBarContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3E8DE",
  },
  tabBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F7EFE7",
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: SAFFRON,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
  },
  tabItemTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#252525",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: SAFFRON,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
  quickActionRow: {
    gap: 10,
  },
  quickActionBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3E8DE",
    gap: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#252525",
  },
  searchBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#EADFD6",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#252525",
    marginLeft: 8,
  },
  searchAction: {
    fontSize: 13,
    fontWeight: "700",
    color: SAFFRON,
  },
  filterPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADFD6",
  },
  filterPillActive: {
    backgroundColor: SAFFRON,
    borderColor: SAFFRON,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#777",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  countLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  userListItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SAFFRON,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 18,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#252525",
  },
  userHandle: {
    fontSize: 12,
    color: "#777",
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  roleTag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  superAdminTag: {
    backgroundColor: "#FEF3C7",
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#444",
  },
  tagSuspended: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBanned: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: SAFFRON,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  createBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  groupDesc: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },
  groupCardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cardDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 4,
  },
  cardDeleteText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "700",
  },
  momentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  momentType: {
    fontSize: 11,
    color: SAFFRON,
    fontWeight: "700",
  },
  momentText: {
    fontSize: 14,
    color: "#252525",
    marginVertical: 6,
  },
  momentExpires: {
    fontSize: 11,
    color: "#888",
  },
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  reportTypeBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: SAFFRON,
  },
  reportReason: {
    fontSize: 14,
    fontWeight: "700",
    color: "#252525",
    marginTop: 4,
  },
  reportDetailsText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  reportMeta: {
    fontSize: 11,
    color: "#888",
    marginTop: 6,
  },
  resolveBtn: {
    backgroundColor: SAFFRON,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  resolveBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  notifCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagActive: {
    backgroundColor: "#DCFCE7",
  },
  tagDraft: {
    backgroundColor: "#F3F4F6",
  },
  notifMessage: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  notifMeta: {
    fontSize: 11,
    color: "#888",
    marginTop: 6,
  },
  notifActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },
  sendNowBtn: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  sendNowText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  settingItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  settingKey: {
    fontSize: 14,
    fontWeight: "800",
    color: "#252525",
  },
  settingDesc: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  settingInput: {
    backgroundColor: "#FFF9F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    minWidth: 80,
    textAlign: "right",
  },
  auditCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: SAFFRON,
    borderWidth: 1,
    borderColor: "#F3E8DE",
  },
  auditAction: {
    fontSize: 13,
    fontWeight: "800",
    color: "#252525",
  },
  auditTime: {
    fontSize: 10,
    color: "#888",
  },
  auditAdmin: {
    fontSize: 12,
    color: SAFFRON,
    fontWeight: "700",
    marginTop: 2,
  },
  auditDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  auditIp: {
    fontSize: 10,
    color: "#AAA",
    marginTop: 2,
  },
  emptyNotice: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 35,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#252525",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginTop: 8,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#FFF9F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EADFD6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#252525",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  saveBtn: {
    backgroundColor: SAFFRON,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
  modActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
  },
  roleBtnRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  roleSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  roleSelectBtnActive: {
    backgroundColor: SAFFRON,
  },
  roleSelectText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#555",
  },
  roleSelectTextActive: {
    color: "#FFF",
  },
  deleteUserBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DC2626",
    gap: 6,
  },
  deleteUserBtnText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 13,
  },
});
