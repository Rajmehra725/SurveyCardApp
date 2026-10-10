import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function MyDetailsScreen() {
  const user = {
    name: "Raj Mehra",
    fatherName: "Raj",
    email: "nagiyaraj.725@gmail.com",
    phone: "7509291446",
    dob: "10/08/2003",
    district: "Maihar",
    address: "Maihar",
    aadhaar: "495499598111",
    photo: "https://raaz-universe.vercel.app/static/media/raj.4d0a96b1326489011457.png",
    aadharphoto: "https://raaz-universe.vercel.app/static/media/1%20(10).dd7f42d6ec67acec74a9.png",
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
       <TouchableOpacity
        onPress={() => router.push("/(tabs)/details")}
      >
        <Ionicons
          name="arrow-back"
          size={28}
          color="#000"
        />
      </TouchableOpacity>

        <Text style={styles.headerTitle}>
          My Details
        </Text>

        <View style={{ width: 30 }} />
      </View>

      <Text style={styles.subtitle}>
        This is your personal information currently available
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Profile */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: user.photo }}
            style={styles.profileImage}
          />
        </View>

        {/* Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Name*
          </Text>

          <TextInput
            value={user.name}
            editable={false}
            style={styles.input}
          />
        </View>

        {/* Father Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Father's name*
          </Text>

          <TextInput
            value={user.fatherName}
            editable={false}
            style={styles.input}
          />
        </View>

        {/* Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Email*
          </Text>

          <TextInput
            value={user.email}
            editable={false}
            style={styles.input}
          />
        </View>

        {/* Phone */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Phone Number*
          </Text>

          <View style={styles.phoneInput}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#777"
            />

            <Text style={styles.countryCode}>
              +91
            </Text>

            <Text style={styles.phoneText}>
              {user.phone}
            </Text>
          </View>
        </View>

        {/* DOB */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            DOB*
          </Text>

          <View style={styles.dateInput}>
            <Text style={styles.dateText}>
              {user.dob}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={24}
              color="#999"
            />
          </View>
        </View>

        {/* District */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            District*
          </Text>

          <TextInput
            value={user.district}
            editable={false}
            style={styles.input}
          />
        </View>

        {/* Address */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Address*
          </Text>

          <TextInput
            value={user.address}
            editable={false}
            style={styles.input}
          />
        </View>

        {/* Aadhaar */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Aadhaar Number*
          </Text>

          <TextInput
            value={user.aadhaar}
            editable={false}
            style={styles.input}
          />
        </View>
         <Text style={styles.label}>
            Aadhaar Photo*
          </Text>
           <View style={styles.imageContainer}>

          <Image
            source={{ uri: user.aadharphoto }}
            style={styles.profileImage}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  backBtn: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
  },

  subtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    fontStyle: "italic",
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 22,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },

  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    color: "#999",
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 8,
  },

  input: {
    height: 70,
    borderWidth: 1.5,
    borderColor: "#D9D9D9",
    borderRadius: 22,
    paddingHorizontal: 18,
    fontSize: 18,
    color: "#222",
    backgroundColor: "#FFF",
  },

  phoneInput: {
    height: 70,
    borderWidth: 1.5,
    borderColor: "#D9D9D9",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  countryCode: {
    marginLeft: 10,
    fontSize: 18,
    color: "#222",
  },

  phoneText: {
    marginLeft: 15,
    fontSize: 18,
    color: "#222",
  },

  dateInput: {
    height: 70,
    borderWidth: 1.5,
    borderColor: "#D9D9D9",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },

  dateText: {
    fontSize: 18,
    color: "#222",
  },
});