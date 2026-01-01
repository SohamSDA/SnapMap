import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { ScreenProps } from "../types";

// Enum values - Gender from backend model
const GENDER_OPTIONS = ["male", "female", "others"];

// Year options - frontend enum
const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th", "5th", "Graduate", "Other"];

// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works fine
// For physical devices, use your computer's IP address
const API_BASE_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:5000"
    : "http://192.168.29.11:5000"
  : "https://your-production-url.com";

const RegisterUserScreen = ({ navigation }: ScreenProps<"RegisterUserScreen">) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.fullName || user?.firstName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    collegeName: "",
    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || "",
    year: "",
    gender: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [genderDropdownVisible, setGenderDropdownVisible] = useState(false);
  const [yearDropdownVisible, setYearDropdownVisible] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.collegeName.trim()) {
      newErrors.collegeName = "College name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill in all required fields correctly");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Check if user is authenticated
      if (!user) {
        Alert.alert("Error", "User not authenticated. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      // Get the JWT token from Clerk
      // Try without template first, then with template if needed
      let token = await getToken();
      
      // If token is null, try with explicit options
      if (!token) {
        try {
          token = await getToken({ template: "default" });
        } catch (templateError) {
          console.log("Template token failed, trying without template");
        }
      }
      
      console.log("Token retrieved:", token ? "Token exists" : "Token is null");
      console.log("Token length:", token?.length || 0);
      
      if (!token) {
        Alert.alert("Error", "Authentication token not available. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      console.log("Making API request to:", `${API_BASE_URL}/api/v1/auth/signup`);
      console.log("Request payload:", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        collegeName: formData.collegeName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        year: formData.year.trim() || undefined,
        gender: formData.gender.trim() || undefined,
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          collegeName: formData.collegeName.trim(),
          phoneNumber: formData.phoneNumber.trim() || undefined,
          year: formData.year.trim() || undefined,
          gender: formData.gender.trim() || undefined,
        }),
      });

      console.log("Response status:", response.status);
      
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        data = { message: "Failed to parse server response" };
      }
      
      console.log("Response data:", data);

      if (!response.ok) {
        const errorMessage = data.message || `Registration failed with status ${response.status}`;
        console.error("API Error:", errorMessage);
        throw new Error(errorMessage);
      }

      // Reload user to get updated metadata from backend
      if (user) {
        try {
          await user.reload();
        } catch (err) {
          console.error("Failed to reload user:", err);
          // Continue anyway since backend registration succeeded
        }
      }

      Alert.alert("Success", "Registration completed successfully!", [
        {
          text: "OK",
          onPress: () => navigation.replace("HomeScreen"),
        },
      ]);
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        error.message || "An error occurred during registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Registration</Text>
        <Text style={styles.subtitle}>Please fill in your details to continue</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
            editable={!isSubmitting}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(value) => updateField("email", value)}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSubmitting}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            College Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.collegeName && styles.inputError]}
            value={formData.collegeName}
            onChangeText={(value) => updateField("collegeName", value)}
            placeholder="Enter your college name"
            placeholderTextColor="#999"
            editable={!isSubmitting}
          />
          {errors.collegeName && (
            <Text style={styles.errorText}>{errors.collegeName}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => !isSubmitting && setGenderDropdownVisible(true)}
            disabled={isSubmitting}
          >
            <Text style={[styles.dropdownText, !formData.gender && styles.dropdownPlaceholder]}>
              {formData.gender || "Select your gender"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          <Modal
            visible={genderDropdownVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setGenderDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setGenderDropdownVisible(false)}
            >
              <View style={styles.dropdownModal}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownOption,
                      formData.gender === option && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      updateField("gender", option);
                      setGenderDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        formData.gender === option && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                    {formData.gender === option && (
                      <Ionicons name="checkmark" size={20} color="#FF4444" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(value) => updateField("phoneNumber", value)}
            placeholder="Enter your phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Year</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => !isSubmitting && setYearDropdownVisible(true)}
            disabled={isSubmitting}
          >
            <Text style={[styles.dropdownText, !formData.year && styles.dropdownPlaceholder]}>
              {formData.year || "Select your year"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          <Modal
            visible={yearDropdownVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setYearDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setYearDropdownVisible(false)}
            >
              <View style={styles.dropdownModal}>
                {YEAR_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownOption,
                      formData.year === option && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      updateField("year", option);
                      setYearDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        formData.year === option && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {formData.year === option && (
                      <Ionicons name="checkmark" size={20} color="#FF4444" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Complete Registration</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RegisterUserScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F5",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#FF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputError: {
    borderColor: "#FF4444",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: "#FF4444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownPlaceholder: {
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "80%",
    maxWidth: 400,
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownOptionSelected: {
    backgroundColor: "#FFF5F5",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownOptionTextSelected: {
    color: "#FF4444",
    fontWeight: "600",
  },
});