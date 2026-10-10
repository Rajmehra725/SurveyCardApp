import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { AuthAPI, UserAPI, UploadAPI } from "../services/api";
import { initSocket } from "../services/socket";
import { Palette, Radii, Shadows, Typography } from "../constants/theme";
import { SmileyXLogo } from "../components/ui/smileyx-logo";

const INTEREST_TAGS = [
  "Music 🎵",
  "Photography 📸",
  "Design 🎨",
  "Tech & AI 💻",
  "Travel ✈️",
  "Gaming 🎮",
  "Fitness & Sports 🏃‍♂️",
  "Reading & Books 📚",
  "Food & Cooking 🍳",
  "Cinema & Movies 🎬",
  "Nature & Outdoors 🌿",
  "Writing ✍️",
];

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Login form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Username validation & live availability
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMsg, setUsernameMsg] = useState("");
  const checkUsernameTimer = useRef<any>(null);

  // Password Recovery modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Onboarding Modal (Step after signup)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingUser, setOnboardingUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [onboardingSaving, setOnboardingSaving] = useState(false);

  // Check saved session on app open
  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    try {
      const token =
        (await AsyncStorage.getItem("smileyx_access_token")) ||
        (await AsyncStorage.getItem("raaz_access_token"));
      const savedUser =
        (await AsyncStorage.getItem("smileyx_user")) ||
        (await AsyncStorage.getItem("raaz_user"));

      if (token && savedUser) {
        const user = JSON.parse(savedUser);
        initSocket(user._id);
        router.replace("/(tabs)/home");
        return;
      }
    } catch (e) {
      console.log("Session check error:", e);
    } finally {
      setCheckingSession(false);
    }
  };

  // Debounced live username availability check
  const handleUsernameChange = (text: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
    setUsernameAvailable(null);
    setUsernameMsg("");

    if (checkUsernameTimer.current) {
      clearTimeout(checkUsernameTimer.current);
    }

    if (clean.length < 3) {
      if (clean.length > 0) {
        setUsernameMsg("At least 3 characters");
      }
      return;
    }

    checkUsernameTimer.current = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const res = await AuthAPI.checkUsername(clean);
        if (res.data?.success) {
          setUsernameAvailable(res.data.available);
          setUsernameMsg(res.data.message);
        }
      } catch (err: any) {
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 400);
  };

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "#E2E8F0" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 9) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: "Weak", color: Palette.error };
    if (score <= 4) return { score: 2, label: "Good", color: Palette.warning };
    return { score: 3, label: "Strong", color: Palette.success };
  };

  const strength = getPasswordStrength(regPassword);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email or username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await AuthAPI.login({
        identifier: identifier.trim(),
        password: password.trim(),
      });

      if (response.data.success) {
        const { token, refreshToken, user } = response.data;
        await AsyncStorage.setItem("smileyx_access_token", token);
        await AsyncStorage.setItem("raaz_access_token", token);
        if (refreshToken) {
          await AsyncStorage.setItem("smileyx_refresh_token", refreshToken);
          await AsyncStorage.setItem("raaz_refresh_token", refreshToken);
        }
        await AsyncStorage.setItem("smileyx_user", JSON.stringify(user));
        await AsyncStorage.setItem("raaz_user", JSON.stringify(user));

        initSocket(user._id);
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Could not sign in. Please verify your credentials and network.";
      Alert.alert("Sign In Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("Full Name Required", "Please enter your full name.");
      return;
    }

    if (!username.trim() || username.length < 3) {
      Alert.alert("Username Required", "Username must be at least 3 characters long.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Valid Email Required", "Please enter a valid email address.");
      return;
    }

    if (regPassword.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters.");
      return;
    }

    if (regPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Password and Confirm Password do not match.");
      return;
    }

    if (!termsAccepted) {
      Alert.alert(
        "Terms & Privacy",
        "Please accept the SmileyX Terms of Service and Privacy Policy to create your account."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await AuthAPI.register({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: regPassword.trim(),
        confirmPassword: confirmPassword.trim(),
        termsAccepted: true,
      });

      if (response.data.success) {
        const { token, refreshToken, user } = response.data;
        await AsyncStorage.setItem("smileyx_access_token", token);
        await AsyncStorage.setItem("raaz_access_token", token);
        if (refreshToken) {
          await AsyncStorage.setItem("smileyx_refresh_token", refreshToken);
          await AsyncStorage.setItem("raaz_refresh_token", refreshToken);
        }
        await AsyncStorage.setItem("smileyx_user", JSON.stringify(user));
        await AsyncStorage.setItem("raaz_user", JSON.stringify(user));

        initSocket(user._id);
        setOnboardingUser(user);
        setDisplayName(user.fullName || "");
        setShowOnboarding(true);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Registration failed. Please check your network and details.";
      Alert.alert("Registration Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!res.canceled && res.assets[0]) {
        setAvatarUri(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Image Error", err.message);
    }
  };

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleCompleteOnboarding = async () => {
    setOnboardingSaving(true);
    try {
      let finalAvatarUrl = "";
      if (avatarUri) {
        const upRes = await UploadAPI.uploadFile(avatarUri);
        if (upRes.data?.success) {
          finalAvatarUrl = upRes.data.file.url;
        }
      }

      await UserAPI.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        profileImage: finalAvatarUrl || onboardingUser?.profileImage || "",
        interests: selectedInterests,
        isProfilePrivate: isPrivateProfile,
      });

      setShowOnboarding(false);
      router.replace("/(tabs)/home");
    } catch (e) {
      console.log("Onboarding save error:", e);
      setShowOnboarding(false);
      router.replace("/(tabs)/home");
    } finally {
      setOnboardingSaving(false);
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    router.replace("/(tabs)/home");
  };

  const handlePasswordRecovery = async () => {
    if (!recoveryIdentifier.trim() || !newPassword.trim()) {
      Alert.alert("Required Fields", "Please enter your email or username and new password.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters.");
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await AuthAPI.recoverPassword({
        identifier: recoveryIdentifier.trim(),
        newPassword: newPassword.trim(),
      });
      if (res.data.success) {
        Alert.alert(
          "Password Updated",
          "Your password has been reset successfully. You can now log in.",
          [{ text: "OK", onPress: () => setShowRecoveryModal(false) }]
        );
        setRecoveryIdentifier("");
        setNewPassword("");
      }
    } catch (err: any) {
      Alert.alert("Reset Failed", err.response?.data?.message || "Could not reset password.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Palette.primaryBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================= BRAND HEADER ================= */}
          <View style={styles.header}>
            <SmileyXLogo size={74} showText={false} />

            <Text style={styles.brandTitle}>
              Smiley<Text style={{ color: Palette.primaryBlue }}>X</Text>
            </Text>
            <Text style={styles.brandTagline}>Your Moments. Your Feelings. Your World.</Text>
            <Text style={styles.brandConcept}>
              Share a Moment • Express a Feeling • Stay Connected
            </Text>

            {/* Tab Switcher: Log In / Sign Up */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, !isRegister && styles.toggleBtnActive]}
                onPress={() => setIsRegister(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    !isRegister && styles.toggleBtnTextActive,
                  ]}
                >
                  Log In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, isRegister && styles.toggleBtnActive]}
                onPress={() => setIsRegister(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    isRegister && styles.toggleBtnTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= FORM CARD ================= */}
          <View style={styles.formCard}>
            {!isRegister ? (
              /* LOGIN FORM */
              <>
                <Text style={styles.inputLabel}>Email or Username</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={20} color={Palette.primaryBlue} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter email or @username"
                    placeholderTextColor="#94A3B8"
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={20} color={Palette.primaryBlue} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => setShowRecoveryModal(true)}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>Log In to SmileyX</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchModeRow}
                  onPress={() => setIsRegister(true)}
                >
                  <Text style={styles.switchModeText}>
                    Don't have an account?{" "}
                    <Text style={styles.switchModeBold}>Create one</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* SIGNUP FORM */
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={20} color={Palette.primaryBlue} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Alex Morgan"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                {/* Unique Username with Availability Indicator */}
                <View style={styles.labelWithStatus}>
                  <Text style={styles.inputLabel}>Choose Unique Username</Text>
                  {usernameChecking ? (
                    <ActivityIndicator size="small" color={Palette.primaryBlue} />
                  ) : usernameAvailable === true ? (
                    <View style={styles.statusBadgeSuccess}>
                      <Ionicons name="checkmark-circle" size={14} color={Palette.success} />
                      <Text style={styles.statusTextSuccess}>Available</Text>
                    </View>
                  ) : usernameAvailable === false ? (
                    <View style={styles.statusBadgeError}>
                      <Ionicons name="close-circle" size={14} color={Palette.error} />
                      <Text style={styles.statusTextError}>Taken</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.inputBox}>
                  <Ionicons name="at" size={22} color={Palette.primaryBlue} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. alex_jay"
                    placeholderTextColor="#94A3B8"
                    value={username}
                    onChangeText={handleUsernameChange}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={20} color={Palette.primaryBlue} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.inputLabel}>Create Password</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={20} color={Palette.primaryBlue} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showRegPassword}
                    value={regPassword}
                    onChangeText={setRegPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword(!showRegPassword)}
                  >
                    <Ionicons
                      name={showRegPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {regPassword.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarBg}>
                      <View
                        style={[
                          styles.strengthBarFill,
                          {
                            width: `${(strength.score / 3) * 100}%`,
                            backgroundColor: strength.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      Strength: {strength.label}
                    </Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={Palette.primaryBlue} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showRegPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
                {confirmPassword.length > 0 && confirmPassword !== regPassword && (
                  <Text style={styles.mismatchText}>Passwords do not match</Text>
                )}

                {/* Terms of Service & Privacy Acceptance */}
                <TouchableOpacity
                  style={styles.termsRow}
                  activeOpacity={0.8}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                >
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                    {termsAccepted && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    I accept the <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>Create My SmileyX Account</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchModeRow}
                  onPress={() => setIsRegister(false)}
                >
                  <Text style={styles.switchModeText}>
                    Already have an account?{" "}
                    <Text style={styles.switchModeBold}>Log In</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#64748B" />
              <Text style={styles.privacyNoteText}>
                No SMS or email OTP required • Instant secure account access
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ================= ONBOARDING MODAL ================= */}
      <Modal visible={showOnboarding} animationType="slide">
        <SafeAreaView style={styles.onboardingContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.onboardingContent}
          >
            <View style={styles.onboardingHeader}>
              <SmileyXLogo size={56} />
              <Text style={styles.onboardingTitle}>Welcome to SmileyX!</Text>
              <Text style={styles.onboardingSubtitle}>
                Let's set up your personal space. You can always change this later.
              </Text>
            </View>

            {/* Avatar Picker */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarPicker}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={32} color={Palette.primaryBlue} />
                    <Text style={styles.avatarUploadText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to choose a profile picture</Text>
            </View>

            {/* Display Name */}
            <Text style={styles.inputLabel}>Display Name</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Name shown to friends"
                placeholderTextColor="#94A3B8"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            {/* Bio */}
            <Text style={styles.inputLabel}>Bio</Text>
            <View style={[styles.inputBox, { height: 78, alignItems: "flex-start", paddingTop: 8 }]}>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                placeholder="A line about yourself, your vibe, or passions..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={bio}
                onChangeText={setBio}
              />
            </View>

            {/* Interests Pills */}
            <Text style={styles.inputLabel}>Select Your Interests (Tap to choose)</Text>
            <View style={styles.pillsContainer}>
              {INTEREST_TAGS.map((tag) => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleInterest(tag)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Profile Visibility Toggle */}
            <TouchableOpacity
              style={styles.privacyToggleCard}
              activeOpacity={0.8}
              onPress={() => setIsPrivateProfile(!isPrivateProfile)}
            >
              <View style={styles.privacyToggleLeft}>
                <Ionicons
                  name={isPrivateProfile ? "lock-closed" : "globe-outline"}
                  size={22}
                  color={Palette.primaryBlue}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.privacyToggleTitle}>
                    {isPrivateProfile ? "Private Profile" : "Public Profile"}
                  </Text>
                  <Text style={styles.privacyToggleDesc}>
                    {isPrivateProfile
                      ? "Only accepted friends can see your moments."
                      : "Anyone on SmileyX can view your public moments."}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isPrivateProfile ? "checkbox" : "square-outline"}
                size={22}
                color={Palette.primaryBlue}
              />
            </TouchableOpacity>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleCompleteOnboarding}
              disabled={onboardingSaving}
            >
              {onboardingSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>Complete Profile & Enter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkipOnboarding}
            >
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ================= PASSWORD RECOVERY MODAL (NO OTP) ================= */}
      <Modal visible={showRecoveryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowRecoveryModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter your registered username or email address and choose a new password.
            </Text>

            <Text style={styles.inputLabel}>Email or Username</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color={Palette.primaryBlue} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter email or @username"
                placeholderTextColor="#94A3B8"
                value={recoveryIdentifier}
                onChangeText={setRecoveryIdentifier}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={Palette.primaryBlue} />
              <TextInput
                style={styles.textInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handlePasswordRecovery}
              disabled={recoveryLoading}
            >
              {recoveryLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>Update Password</Text>
              )}
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
    backgroundColor: Palette.lightBg,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: Palette.primaryTextLight,
    marginTop: 10,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 14,
    color: Palette.secondaryTextLight,
    marginTop: 4,
    fontWeight: "600",
  },
  brandConcept: {
    fontSize: 11,
    color: Palette.accentCyan,
    marginTop: 4,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: Radii.lg,
    padding: 4,
    marginTop: 20,
    width: "100%",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radii.md,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    ...Shadows.sm,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.secondaryTextLight,
  },
  toggleBtnTextActive: {
    color: Palette.primaryBlue,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xxl,
    padding: 22,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadows.md,
  },
  labelWithStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 6,
  },
  statusBadgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusTextSuccess: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: "700",
  },
  statusBadgeError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusTextError: {
    fontSize: 12,
    color: Palette.error,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.primaryTextLight,
    marginTop: 12,
    marginBottom: 6,
  },
  inputBox: {
    height: 52,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Palette.borderLight,
    backgroundColor: "#F8FAFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: Palette.primaryTextLight,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  strengthBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginRight: 10,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  mismatchText: {
    fontSize: 11,
    color: Palette.error,
    marginTop: 4,
    fontWeight: "600",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: Palette.primaryBlue,
    borderColor: Palette.primaryBlue,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: Palette.secondaryTextLight,
    lineHeight: 18,
  },
  termsLink: {
    color: Palette.primaryBlue,
    fontWeight: "700",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 10,
  },
  forgotText: {
    color: Palette.primaryBlue,
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtn: {
    height: 52,
    backgroundColor: Palette.primaryBlue,
    borderRadius: Radii.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    ...Shadows.brandGlow,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  switchModeRow: {
    alignItems: "center",
    marginTop: 16,
  },
  switchModeText: {
    fontSize: 13,
    color: Palette.secondaryTextLight,
  },
  switchModeBold: {
    color: Palette.primaryBlue,
    fontWeight: "800",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    gap: 6,
  },
  privacyNoteText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: Palette.lightBg,
  },
  onboardingContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
  },
  onboardingHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  onboardingTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Palette.primaryTextLight,
    marginTop: 10,
  },
  onboardingSubtitle: {
    fontSize: 13,
    color: Palette.secondaryTextLight,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarPicker: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: Palette.skyBlue,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarUploadText: {
    fontSize: 11,
    color: Palette.primaryBlue,
    fontWeight: "700",
    marginTop: 4,
  },
  avatarHint: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
    marginTop: 6,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginBottom: 14,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  pillSelected: {
    backgroundColor: Palette.primaryBlue,
    borderColor: Palette.primaryBlue,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.secondaryTextLight,
  },
  pillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  privacyToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    marginTop: 6,
    marginBottom: 10,
  },
  privacyToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  privacyToggleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.primaryTextLight,
  },
  privacyToggleDesc: {
    fontSize: 11,
    color: Palette.secondaryTextLight,
    marginTop: 2,
  },
  skipBtn: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.secondaryTextLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 18, 32, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.xxl,
    padding: 22,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Palette.primaryTextLight,
  },
  modalDesc: {
    fontSize: 13,
    color: Palette.secondaryTextLight,
    marginVertical: 10,
    lineHeight: 18,
  },
});