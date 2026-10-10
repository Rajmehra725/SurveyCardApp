import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { ChatAPI, UploadAPI, ReportAPI } from "../../services/api";
import {
  getSocket,
  joinRoom,
  leaveRoom,
  emitTyping,
  emitStopTyping,
  emitMarkSeen,
  emitMarkDelivered,
} from "../../services/socket";
import { Palette, Radii, Shadows } from "../../constants/theme";

const SAFFRON = Palette.primaryBlue;
const BG_WARM = Palette.lightBg;
const EMOJIS = ["❤️", "👍", "🔥", "😂", "👏", "😮", "🙏"];

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [replyMessage, setReplyMessage] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);

  // Search & Navigation
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Forwarding Modal
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [forwardingLoading, setForwardingLoading] = useState(false);

  // Reaction & Action Modal
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Reporting Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate Content");
  const [reportDetails, setReportDetails] = useState("");
  const [reportingLoading, setReportingLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    loadUserAndMessages();

    // Socket Setup
    if (conversationId) {
      joinRoom(conversationId);
    }

    const socket = getSocket();
    if (socket) {
      // Listen for incoming messages
      socket.on("newMessage", (newMsg: any) => {
        if (newMsg.conversation === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
          // Mark delivered and seen if sent by someone else
          if (currentUser && newMsg.sender?._id !== currentUser._id) {
            emitMarkDelivered(conversationId, [newMsg._id], currentUser._id);
            emitMarkSeen(conversationId, newMsg._id, currentUser._id);
          }
        }
      });

      // Typing indicators
      socket.on("userTyping", (data: any) => {
        if (data.conversationId === conversationId) {
          setIsTyping(true);
        }
      });

      socket.on("userStoppedTyping", (data: any) => {
        if (data.conversationId === conversationId) {
          setIsTyping(false);
        }
      });

      // Message updates (reactions, edits, deletions, pins)
      socket.on("reactionUpdated", (data: any) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId ? { ...m, reactions: data.reactions } : m
          )
        );
      });

      socket.on("messageUpdated", (updatedMsg: any) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
        );
      });

      socket.on("messageDeleted", (data: any) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId
              ? { ...m, isDeletedForEveryone: true, text: "This message was deleted", attachments: [] }
              : m
          )
        );
      });

      socket.on("messagePinned", (data: any) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId ? { ...m, pinned: data.pinned } : m
          )
        );
      });

      // Delivery acknowledgments (Double tick)
      socket.on("messageDeliveredUpdate", (data: any) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) =>
            prev.map((m) =>
              data.messageIds?.includes(m._id) || m._id === data.messageId
                ? { ...m, status: m.status === "seen" ? "seen" : "delivered" }
                : m
            )
          );
        }
      });

      // Read receipts (Blue double tick)
      socket.on("messageSeenUpdate", (data: any) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === data.messageId ? { ...m, status: "seen" } : m
            )
          );
        }
      });

      // Presence changes for recipient
      socket.on("userPresenceChanged", (data: any) => {
        setOtherUser((prev: any) => {
          if (prev && prev._id === data.userId) {
            return {
              ...prev,
              isOnline: data.isOnline,
              lastSeen: data.lastSeen,
            };
          }
          return prev;
        });
      });
    }

    return () => {
      if (conversationId) {
        leaveRoom(conversationId);
      }
      if (socket) {
        socket.off("newMessage");
        socket.off("userTyping");
        socket.off("userStoppedTyping");
        socket.off("reactionUpdated");
        socket.off("messageUpdated");
        socket.off("messageDeleted");
        socket.off("messagePinned");
        socket.off("messageDeliveredUpdate");
        socket.off("messageSeenUpdate");
        socket.off("userPresenceChanged");
      }
    };
  }, [conversationId, currentUser?._id]);

  const loadUserAndMessages = async () => {
    try {
      const userJson =
        (await AsyncStorage.getItem("smileyx_user")) ||
        (await AsyncStorage.getItem("raaz_user"));
      let userObj = null;
      if (userJson) {
        userObj = JSON.parse(userJson);
        setCurrentUser(userObj);
      }

      if (conversationId) {
        // Fetch conversation details (participants, title, bio, presence)
        try {
          const detailRes = await ChatAPI.getConversationDetails(conversationId);
          if (detailRes.data?.success && detailRes.data.conversation) {
            setConversation(detailRes.data.conversation);
            if (detailRes.data.conversation.otherUser) {
              setOtherUser(detailRes.data.conversation.otherUser);
            }
          }
        } catch (detailErr) {
          console.log("Error loading conversation details:", detailErr);
        }

        // Fetch messages
        const res = await ChatAPI.getMessages(conversationId);
        if (res.data?.success) {
          const msgs = res.data.messages || [];
          setMessages(msgs);

          // Acknowledge delivery for incoming messages with status sent
          const undeliveredIds = msgs
            .filter((m: any) => m.sender?._id !== userObj?._id && m.status === "sent")
            .map((m: any) => m._id);
          if (undeliveredIds.length > 0 && userObj?._id) {
            emitMarkDelivered(conversationId, undeliveredIds, userObj._id);
          }

          // Acknowledge read for last incoming message
          const lastIncoming = msgs.slice().reverse().find((m: any) => m.sender?._id !== userObj?._id);
          if (lastIncoming && userObj?._id) {
            emitMarkSeen(conversationId, lastIncoming._id, userObj._id);
          }
        }
      }
    } catch (e) {
      console.log("Error loading chat messages:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (!currentUser || !conversationId) return;

    emitTyping(conversationId, {
      _id: currentUser._id,
      fullName: currentUser.fullName,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(conversationId, currentUser._id);
    }, 1500);
  };

  const handleSend = async () => {
    if (!text.trim() && !editingMessage) return;

    if (editingMessage) {
      // Editing existing message
      try {
        const res = await ChatAPI.editMessage(editingMessage._id, text.trim());
        if (res.data?.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === editingMessage._id ? res.data.message : m))
          );
          setEditingMessage(null);
          setText("");
        }
      } catch (err: any) {
        Alert.alert("Error", err.response?.data?.message || "Failed to edit message");
      }
      return;
    }

    // New message
    const msgPayload = {
      text: text.trim(),
      messageType: "text",
      replyTo: replyMessage?._id,
    };

    setText("");
    setReplyMessage(null);

    try {
      const res = await ChatAPI.sendMessage(conversationId, msgPayload);
      if (res.data?.success) {
        // Appended via socket or locally
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === res.data.message._id);
          return exists ? prev : [...prev, res.data.message];
        });
      }
    } catch (err: any) {
      Alert.alert("Send Error", err.response?.data?.message || "Could not send message");
    }
  };

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setLoading(true);
        const uploadRes = await UploadAPI.uploadFile(
          asset.uri,
          asset.fileName || "attachment.jpg",
          asset.mimeType || "image/jpeg"
        );

        if (uploadRes.data?.success) {
          const mediaFile = uploadRes.data.file;
          await ChatAPI.sendMessage(conversationId, {
            text: "",
            messageType: mediaFile.fileType,
            attachments: [
              {
                url: mediaFile.url,
                fileType: mediaFile.fileType,
                fileName: mediaFile.originalName,
                fileSize: mediaFile.size,
              },
            ],
          });
        }
      }
    } catch (e: any) {
      Alert.alert("Upload Error", e.message || "Failed to send attachment");
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (emoji: string) => {
    if (!selectedMessage) return;
    try {
      await ChatAPI.react(selectedMessage._id, emoji);
      setShowActionModal(false);
      setSelectedMessage(null);
    } catch (e) {
      console.log("React error:", e);
    }
  };

  const handleCopy = async () => {
    if (!selectedMessage) return;
    setShowActionModal(false);
    if (selectedMessage.text) {
      await Clipboard.setStringAsync(selectedMessage.text);
      Alert.alert("Copied", "Message text copied to clipboard.");
    }
  };

  const openForwardModal = async () => {
    if (!selectedMessage) return;
    setShowActionModal(false);
    setShowForwardModal(true);
    try {
      const res = await ChatAPI.getConversations();
      if (res.data?.success) {
        setConversationsList(res.data.conversations || []);
      }
    } catch (e) {
      console.log("Error loading conversations for forward:", e);
    }
  };

  const handleExecuteForward = async (targetConvId: string) => {
    if (!selectedMessage) return;
    setForwardingLoading(true);
    try {
      await ChatAPI.forwardMessage(selectedMessage._id, targetConvId);
      setShowForwardModal(false);
      setSelectedMessage(null);
      Alert.alert("Forwarded", "Message forwarded successfully.");
    } catch (e: any) {
      Alert.alert("Forward Error", e.response?.data?.message || "Failed to forward message");
    } finally {
      setForwardingLoading(false);
    }
  };

  const handleClearChatHistory = async () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear your chat history for this conversation? This will delete messages on your device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Chat",
          style: "destructive",
          onPress: async () => {
            try {
              await ChatAPI.clearChat(conversationId);
              setMessages([]);
              setShowInfoModal(false);
              setShowConversationMenu(false);
              Alert.alert("Chat Cleared", "Messages cleared from your history.");
            } catch (e: any) {
              Alert.alert("Clear Error", e.response?.data?.message || "Failed to clear chat");
            }
          },
        },
      ]
    );
  };

  const handleTogglePin = async () => {
    if (!selectedMessage) return;
    setShowActionModal(false);
    try {
      const res = await ChatAPI.togglePin(selectedMessage._id);
      if (res.data?.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === selectedMessage._id ? { ...m, pinned: res.data.pinned } : m
          )
        );
      }
    } catch (e: any) {
      Alert.alert("Pin Error", e.response?.data?.message || "Could not toggle pin");
    }
  };

  const handleDelete = async (forEveryone: boolean) => {
    if (!selectedMessage) return;
    setShowActionModal(false);
    const targetId = selectedMessage._id;

    if (forEveryone) {
      Alert.alert(
        "Delete for Everyone",
        "Are you sure you want to delete this message for everyone in the chat?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await ChatAPI.deleteMessage(targetId, true);
                setMessages((prev) =>
                  prev.map((m) =>
                    m._id === targetId
                      ? {
                          ...m,
                          isDeletedForEveryone: true,
                          text: "This message was deleted",
                          attachments: [],
                        }
                      : m
                  )
                );
              } catch (e: any) {
                Alert.alert("Delete Error", e.response?.data?.message || "Could not delete");
              }
            },
          },
        ]
      );
    } else {
      try {
        await ChatAPI.deleteMessage(targetId, false);
        setMessages((prev) => prev.filter((m) => m._id !== targetId));
      } catch (e: any) {
        Alert.alert("Delete Error", e.response?.data?.message || "Could not delete");
      }
    }
  };

  const startEdit = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setText(selectedMessage.text);
    setShowActionModal(false);
  };

  const handleOpenReportModal = () => {
    setShowActionModal(false);
    setShowReportModal(true);
  };

  const handleReportSubmit = async () => {
    if (!selectedMessage) return;
    setReportingLoading(true);
    try {
      await ReportAPI.submit({
        targetType: "message",
        targetId: selectedMessage._id,
        targetUserId: selectedMessage.sender?._id,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      setShowReportModal(false);
      setReportDetails("");
      Alert.alert("Report Submitted", "Thank you for reporting. Our moderation team will review this case.");
    } catch (e: any) {
      Alert.alert("Report Error", e.response?.data?.message || "Failed to submit report");
    } finally {
      setReportingLoading(false);
    }
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    const isMe = item.sender?._id === currentUser?._id;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => {
          setSelectedMessage(item);
          setShowActionModal(true);
        }}
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
            item.isDeletedForEveryone && styles.bubbleDeleted,
          ]}
        >
          {/* Reply Context */}
          {item.replyTo && (
            <View style={styles.replyBox}>
              <Text style={styles.replySender}>{item.replyTo.senderName}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {item.replyTo.text}
              </Text>
            </View>
          )}

          {/* Media Attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentContainer}>
              {item.attachments.map((att: any, idx: number) => (
                <Image
                  key={idx}
                  source={{ uri: att.url }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* Top Pin Indicator */}
          {item.pinned && (
            <View style={styles.pinnedRow}>
              <Ionicons name="pin" size={12} color={SAFFRON} />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}

          {/* Text */}
          <Text
            style={[
              styles.bubbleText,
              isMe ? styles.bubbleTextRight : styles.bubbleTextLeft,
              item.isDeletedForEveryone && styles.bubbleTextDeleted,
            ]}
          >
            {item.text}
          </Text>

          {/* Timestamp & Status */}
          <View style={styles.metaRow}>
            {item.isEdited && <Text style={styles.editedText}>edited • </Text>}
            <Text style={isMe ? styles.metaTimeRight : styles.metaTimeLeft}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            {isMe && !item.isDeletedForEveryone && (
              <Ionicons
                name={
                  item.status === "seen" || item.status === "delivered"
                    ? "checkmark-done"
                    : "checkmark"
                }
                size={14}
                color={item.status === "seen" ? "#38BDF8" : "rgba(255,255,255,0.75)"}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          {/* Emoji Reactions */}
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionBadge}>
              {item.reactions.map((r: any, idx: number) => (
                <Text key={idx} style={styles.reactionEmoji}>
                  {r.emoji}
                </Text>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        {/* Recipient Avatar */}
        <TouchableOpacity
          style={styles.headerAvatarContainer}
          activeOpacity={0.8}
          onPress={() => setShowInfoModal(true)}
        >
          {otherUser?.profileImage ? (
            <Image source={{ uri: otherUser.profileImage }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>
                {((otherUser?.displayName || otherUser?.fullName || conversation?.name || "U")[0]).toUpperCase()}
              </Text>
            </View>
          )}
          {otherUser?.isOnline && <View style={styles.headerOnlineBadge} />}
        </TouchableOpacity>

        {/* Name and Status */}
        <TouchableOpacity
          style={styles.headerInfo}
          activeOpacity={0.8}
          onPress={() => setShowInfoModal(true)}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUser?.displayName || otherUser?.fullName || conversation?.name || "Conversation"}
            </Text>
            {otherUser?.username && (
              <Text style={styles.headerUsername} numberOfLines={1}>
                {" @" + otherUser.username}
              </Text>
            )}
          </View>
          <Text style={[styles.headerStatus, isTyping && { color: "#38BDF8", fontWeight: "700" }]}>
            {isTyping
              ? "typing..."
              : otherUser?.isOnline
              ? "Online"
              : otherUser?.lastSeen
              ? `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "SmileyX Secure Chat"}
          </Text>
        </TouchableOpacity>

        {/* Call & Menu Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() =>
              Alert.alert(
                "Audio Call",
                `Connecting secure voice call to ${otherUser?.displayName || otherUser?.fullName || "user"}...`
              )
            }
          >
            <Ionicons name="call-outline" size={20} color={Palette.primaryBlue} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() =>
              Alert.alert(
                "Video Call",
                `Connecting HD video call to ${otherUser?.displayName || otherUser?.fullName || "user"}...`
              )
            }
          >
            <Ionicons name="videocam-outline" size={21} color={Palette.primaryBlue} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowConversationMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      {/* In-Chat Message Search Bar */}
      {isSearching && (
        <View style={styles.chatSearchBox}>
          <Ionicons name="search" size={18} color={Palette.primaryBlue} />
          <TextInput
            style={styles.chatSearchInput}
            placeholder="Search in conversation..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              setIsSearching(false);
              setSearchQuery("");
            }}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Messages List */}
        {loading ? (
          <ActivityIndicator color={SAFFRON} style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={
              searchQuery.trim()
                ? messages.filter((m) =>
                    m.text?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : messages
            }
            keyExtractor={(item) => item._id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* Reply Preview Bar */}
        {replyMessage && (
          <View style={styles.replyPreviewBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.replySender}>Replying to {replyMessage.senderName}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyMessage.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyMessage(null)}>
              <Ionicons name="close-circle" size={20} color="#777" />
            </TouchableOpacity>
          </View>
        )}

        {/* Editing Preview Bar */}
        {editingMessage && (
          <View style={styles.replyPreviewBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.replySender}>Editing message</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {editingMessage.text}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditingMessage(null);
                setText("");
              }}
            >
              <Ionicons name="close-circle" size={20} color="#777" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handlePickMedia}
            activeOpacity={0.8}
          >
            <Ionicons name="image-outline" size={22} color={SAFFRON} />
          </TouchableOpacity>

          <TextInput
            style={styles.inputField}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            placeholderTextColor="#999"
            value={text}
            onChangeText={handleTextChange}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              text.trim().length > 0 && styles.sendBtnActive,
            ]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name={editingMessage ? "checkmark" : "send"} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Message Reaction & Comprehensive Action Modal */}
      <Modal visible={showActionModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={styles.actionModalCard}>
            {/* Quick Emoji Bar */}
            <View style={styles.emojiRow}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiBtn}
                  onPress={() => handleReact(emoji)}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalDivider} />

            {/* Reply */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setReplyMessage(selectedMessage);
                setShowActionModal(false);
              }}
            >
              <Ionicons name="arrow-undo-outline" size={20} color="#252525" />
              <Text style={styles.actionItemText}>Reply</Text>
            </TouchableOpacity>

            {/* Edit Message (Sender Only) */}
            {selectedMessage?.sender?._id === currentUser?._id && !selectedMessage?.isDeletedForEveryone && (
              <TouchableOpacity style={styles.actionItem} onPress={startEdit}>
                <Ionicons name="pencil-outline" size={20} color={SAFFRON} />
                <Text style={[styles.actionItemText, { color: SAFFRON, fontWeight: "700" }]}>
                  Edit Message
                </Text>
              </TouchableOpacity>
            )}

            {/* Copy */}
            {Boolean(selectedMessage?.text) && (
              <TouchableOpacity style={styles.actionItem} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={20} color="#252525" />
                <Text style={styles.actionItemText}>Copy Text</Text>
              </TouchableOpacity>
            )}

            {/* Forward / Share */}
            {!selectedMessage?.isDeletedForEveryone && (
              <TouchableOpacity style={styles.actionItem} onPress={openForwardModal}>
                <Ionicons name="share-social-outline" size={20} color="#252525" />
                <Text style={styles.actionItemText}>Forward to Conversation</Text>
              </TouchableOpacity>
            )}

            {/* Pin / Unpin */}
            <TouchableOpacity style={styles.actionItem} onPress={handleTogglePin}>
              <Ionicons
                name={selectedMessage?.pinned ? "pin-sharp" : "pin-outline"}
                size={20}
                color={selectedMessage?.pinned ? SAFFRON : "#252525"}
              />
              <Text style={styles.actionItemText}>
                {selectedMessage?.pinned ? "Unpin Message" : "Pin Message"}
              </Text>
            </TouchableOpacity>

            {/* Delete for Me */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleDelete(false)}
            >
              <Ionicons name="trash-bin-outline" size={20} color="#666" />
              <Text style={styles.actionItemText}>Delete for Me</Text>
            </TouchableOpacity>

            {/* Delete for Everyone */}
            {(selectedMessage?.sender?._id === currentUser?._id ||
              currentUser?.role === "admin" ||
              currentUser?.role === "super_admin") &&
              !selectedMessage?.isDeletedForEveryone && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => handleDelete(true)}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  <Text style={[styles.actionItemText, { color: "#DC2626" }]}>
                    Delete for Everyone
                  </Text>
                </TouchableOpacity>
              )}

            {/* Report Message (Non-Sender) */}
            {selectedMessage?.sender?._id !== currentUser?._id && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleOpenReportModal}
              >
                <Ionicons name="flag-outline" size={20} color="#DC2626" />
                <Text style={[styles.actionItemText, { color: "#DC2626" }]}>
                  Report Message
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Safety Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Report Message</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportSubtitle}>
              Help us keep SmileyX safe. Select the reason for this report:
            </Text>

            {[
              "Inappropriate Content",
              "Harassment or Bullying",
              "Spam or Advertising",
              "Hate Speech",
              "Other Safety Concern",
            ].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  reportReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setReportReason(reason)}
              >
                <Ionicons
                  name={reportReason === reason ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={reportReason === reason ? SAFFRON : "#888"}
                />
                <Text
                  style={[
                    styles.reasonText,
                    reportReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.reportInput}
              placeholder="Provide details for moderators (optional)..."
              placeholderTextColor="#999"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitReportBtn}
              onPress={handleReportSubmit}
              disabled={reportingLoading}
            >
              {reportingLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitReportBtnText}>Submit Safety Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Conversation 3-Dot Options Menu Modal */}
      <Modal visible={showConversationMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConversationMenu(false)}
        >
          <View style={styles.conversationMenuCard}>
            <Text style={styles.menuTitle}>Conversation Options</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowConversationMenu(false);
                setShowInfoModal(true);
              }}
            >
              <Ionicons name="person-circle-outline" size={22} color={Palette.primaryBlue} />
              <Text style={styles.menuItemText}>View Profile & Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowConversationMenu(false);
                setIsSearching(true);
              }}
            >
              <Ionicons name="search-outline" size={22} color="#111827" />
              <Text style={styles.menuItemText}>Search in Conversation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowConversationMenu(false);
                setShowInfoModal(true);
              }}
            >
              <Ionicons name="images-outline" size={22} color="#111827" />
              <Text style={styles.menuItemText}>Shared Media & Files</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleClearChatHistory}
            >
              <Ionicons name="trash-outline" size={22} color="#DC2626" />
              <Text style={[styles.menuItemText, { color: "#DC2626" }]}>Clear Chat History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowConversationMenu(false);
                setShowReportModal(true);
              }}
            >
              <Ionicons name="flag-outline" size={22} color="#DC2626" />
              <Text style={[styles.menuItemText, { color: "#DC2626" }]}>Report Conversation</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Conversation Details & Shared Media Modal */}
      <Modal visible={showInfoModal} animationType="slide">
        <SafeAreaView style={styles.infoModalSafe}>
          <View style={styles.infoModalHeader}>
            <TouchableOpacity onPress={() => setShowInfoModal(false)}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.infoModalTitle}>Chat Details</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoModalContent}>
            {/* Big Avatar & Identity */}
            <View style={styles.infoProfileCard}>
              {otherUser?.profileImage ? (
                <Image source={{ uri: otherUser.profileImage }} style={styles.infoAvatar} />
              ) : (
                <View style={styles.infoAvatarFallback}>
                  <Text style={styles.infoAvatarInitial}>
                    {((otherUser?.displayName || otherUser?.fullName || "U")[0]).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.infoFullName}>
                {otherUser?.displayName || otherUser?.fullName || conversation?.name || "Conversation"}
              </Text>
              {otherUser?.username && (
                <Text style={styles.infoUsername}>@{otherUser.username}</Text>
              )}
              {Boolean(otherUser?.bio) && (
                <Text style={styles.infoBio}>{otherUser.bio}</Text>
              )}
              <View style={styles.infoPresenceBadge}>
                <View
                  style={[
                    styles.infoStatusDot,
                    { backgroundColor: otherUser?.isOnline ? "#16A34A" : "#94A3B8" },
                  ]}
                />
                <Text style={styles.infoStatusText}>
                  {otherUser?.isOnline
                    ? "Active Now"
                    : otherUser?.lastSeen
                    ? `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Presence Private"}
                </Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.infoActionsRow}>
              <TouchableOpacity
                style={styles.infoActionPill}
                onPress={() => {
                  setShowInfoModal(false);
                  Alert.alert("Audio Call", "Connecting voice call...");
                }}
              >
                <Ionicons name="call" size={20} color={Palette.primaryBlue} />
                <Text style={styles.infoActionPillText}>Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoActionPill}
                onPress={() => {
                  setShowInfoModal(false);
                  Alert.alert("Video Call", "Connecting HD video...");
                }}
              >
                <Ionicons name="videocam" size={20} color={Palette.primaryBlue} />
                <Text style={styles.infoActionPillText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoActionPill}
                onPress={() => {
                  setShowInfoModal(false);
                  setIsSearching(true);
                }}
              >
                <Ionicons name="search" size={20} color={Palette.primaryBlue} />
                <Text style={styles.infoActionPillText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Shared Media Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Shared Media</Text>
              {conversation?.sharedMedia && conversation.sharedMedia.length > 0 ? (
                <View style={styles.sharedMediaGrid}>
                  {conversation.sharedMedia.map((m: any, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri: m.attachments[0]?.url }}
                      style={styles.sharedMediaThumb}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyMediaText}>No shared photos or videos in this chat yet.</Text>
              )}
            </View>

            {/* Dangerous Actions */}
            <View style={styles.infoSection}>
              <TouchableOpacity style={styles.dangerRow} onPress={handleClearChatHistory}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={styles.dangerText}>Clear Chat History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerRow}
                onPress={() => {
                  setShowInfoModal(false);
                  setShowReportModal(true);
                }}
              >
                <Ionicons name="flag-outline" size={20} color="#DC2626" />
                <Text style={styles.dangerText}>Report User</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* In-App Forward Message Modal */}
      <Modal visible={showForwardModal} animationType="slide">
        <SafeAreaView style={styles.infoModalSafe}>
          <View style={styles.infoModalHeader}>
            <TouchableOpacity onPress={() => setShowForwardModal(false)}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.infoModalTitle}>Forward Message</Text>
            <View style={{ width: 26 }} />
          </View>

          {forwardingLoading ? (
            <ActivityIndicator color={Palette.primaryBlue} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={conversationsList.filter((c) => c._id !== conversationId)}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.forwardChatItem}
                  onPress={() => handleExecuteForward(item._id)}
                >
                  <View style={styles.forwardAvatarFallback}>
                    <Text style={styles.forwardAvatarInitial}>
                      {(item.title ? item.title[0] : "C").toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.forwardChatTitle}>{item.title}</Text>
                    <Text style={styles.forwardChatSub} numberOfLines={1}>
                      {item.lastMessageText || "Tap to forward"}
                    </Text>
                  </View>
                  <Ionicons name="send" size={18} color={Palette.primaryBlue} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 40 }}>
                  No other active conversations found.
                </Text>
              )}
            />
          )}
        </SafeAreaView>
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
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3E8DE",
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#252525",
  },
  headerStatus: {
    fontSize: 11,
    color: SAFFRON,
    fontWeight: "600",
  },
  headerIconBtn: {
    padding: 6,
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: "relative",
  },
  bubbleRight: {
    backgroundColor: SAFFRON,
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EFE6DC",
  },
  bubbleDeleted: {
    backgroundColor: "#EDE7DF",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextRight: {
    color: "#FFFFFF",
  },
  bubbleTextLeft: {
    color: "#252525",
  },
  bubbleTextDeleted: {
    color: "#888888",
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  editedText: {
    fontSize: 10,
    color: "#E2E2E2",
    fontStyle: "italic",
  },
  metaTimeRight: {
    fontSize: 10,
    color: "#FFEAD4",
  },
  metaTimeLeft: {
    fontSize: 10,
    color: "#8E8882",
  },
  reactionBadge: {
    flexDirection: "row",
    position: "absolute",
    bottom: -10,
    left: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#EADFD6",
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  attachmentContainer: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  attachmentImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },
  replyBox: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: SAFFRON,
  },
  replySender: {
    fontSize: 11,
    fontWeight: "800",
    color: SAFFRON,
  },
  replyText: {
    fontSize: 12,
    color: "#555",
  },
  replyPreviewBar: {
    backgroundColor: "#FFF3E6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3E8DE",
  },
  inputBar: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3E8DE",
  },
  attachBtn: {
    padding: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: "#FFF9F2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EADFD6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
    color: "#252525",
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9D0C7",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: SAFFRON,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  actionModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 35,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 15,
  },
  emojiBtn: {
    padding: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F3E8DE",
    marginVertical: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  actionItemText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#252525",
  },
  pinnedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: "800",
    color: SAFFRON,
  },
  reportModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 35,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#252525",
  },
  reportSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFF9F2",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EADFD6",
    gap: 10,
  },
  reasonOptionSelected: {
    borderColor: SAFFRON,
    backgroundColor: "#FFF2E2",
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  reasonTextSelected: {
    color: SAFFRON,
    fontWeight: "800",
  },
  reportInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 12,
    fontSize: 14,
    color: "#252525",
    height: 80,
    textAlignVertical: "top",
    marginVertical: 10,
  },
  submitReportBtn: {
    backgroundColor: SAFFRON,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  submitReportBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  headerAvatarContainer: {
    position: "relative",
    marginRight: 10,
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
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  headerOnlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#16A34A",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerUsername: {
    fontSize: 12,
    color: Palette.secondaryTextLight,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerActionBtn: {
    padding: 7,
  },
  chatSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
    gap: 10,
  },
  chatSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.primaryTextLight,
  },
  conversationMenuCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 35,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Palette.primaryTextLight,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: Palette.primaryTextLight,
  },
  infoModalSafe: {
    flex: 1,
    backgroundColor: Palette.lightBg,
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
    backgroundColor: "#FFFFFF",
  },
  infoModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  infoModalContent: {
    padding: 16,
  },
  infoProfileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginBottom: 16,
  },
  infoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  infoAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  infoAvatarInitial: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  infoFullName: {
    fontSize: 18,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  infoUsername: {
    fontSize: 13,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
  infoBio: {
    fontSize: 13,
    color: Palette.secondaryTextLight,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  infoPresenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  infoStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoStatusText: {
    fontSize: 12,
    color: Palette.secondaryTextLight,
    fontWeight: "600",
  },
  infoActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  infoActionPill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.lg,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.borderLight,
    gap: 4,
  },
  infoActionPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.primaryBlue,
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginBottom: 16,
  },
  infoSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Palette.primaryTextLight,
    marginBottom: 12,
  },
  sharedMediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sharedMediaThumb: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: Radii.md,
  },
  emptyMediaText: {
    fontSize: 13,
    color: Palette.secondaryTextLight,
    fontStyle: "italic",
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  dangerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  forwardChatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginBottom: 10,
  },
  forwardAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  forwardAvatarInitial: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  forwardChatTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.primaryTextLight,
  },
  forwardChatSub: {
    fontSize: 12,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
});
