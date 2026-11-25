
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const STORAGE_KEYS = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phoneNumber',
  avatar: 'avatarImage',
  notifications: 'emailNotifications',
};

const DEFAULT_NOTIFICATIONS = {
  orderStatuses: true,
  passwordChanges: true,
  specialOffers: true,
  newsletter: true,
};

export default function Profile({ onLogout }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);

  const [notifications, setNotifications] = useState(
    DEFAULT_NOTIFICATIONS
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.firstName,
        STORAGE_KEYS.lastName,
        STORAGE_KEYS.email,
        STORAGE_KEYS.phone,
        STORAGE_KEYS.avatar,
        STORAGE_KEYS.notifications,
      ]);

      const data = Object.fromEntries(values);

      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setEmail(data.email || '');
      setPhone(data.phoneNumber || '');
      setAvatar(data.avatarImage || null);

      if (data.emailNotifications) {
        const savedNotifications = JSON.parse(
          data.emailNotifications
        );

        setNotifications({
          ...DEFAULT_NOTIFICATIONS,
          ...savedNotifications,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Unable to load your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // Basic email validation
  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Letters, including international characters
  const nameRegex = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

  const isFirstNameValid = nameRegex.test(firstName.trim());

  const isLastNameValid =
    lastName.trim() === '' ||
    nameRegex.test(lastName.trim());

  // US phone number: optional +1, valid area/exchange prefixes
  const phoneDigits = phone.replace(/\D/g, '');

  const normalizedPhone =
    phoneDigits.length === 11 && phoneDigits.startsWith('1')
      ? phoneDigits.slice(1)
      : phoneDigits;

  const isPhoneValid =
    phone.trim() === '' ||
    (
      /^(?:\+?1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?[2-9]\d{2}[\s.-]?\d{4}$/.test(
        phone.trim()
      ) &&
      normalizedPhone.length === 10
    );

  const isFormValid =
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    isPhoneValid;

  const getInitials = () => {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);

    return (first + last).toUpperCase() || '?';
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selected = result.assets[0];

        if (selected.base64) {
          const mime = selected.mimeType || 'image/jpeg';
          setAvatar(`data:${mime};base64,${selected.base64}`);
        } else {
          Alert.alert(
            'Image error',
            'Could not read the selected image.'
          );
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Unable to select an image.');
    }
  };

  const removeImage = () => {
    setAvatar(null);
  };

  const toggleNotification = (key) => {
    setNotifications((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const saveChanges = async () => {
    if (!isFormValid || isSaving) {
      Alert.alert(
        'Invalid details',
        'Please check your name, email and US phone number.'
      );
      return;
    }

    setIsSaving(true);

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.firstName, firstName.trim()],
        [STORAGE_KEYS.lastName, lastName.trim()],
        [STORAGE_KEYS.email, email.trim()],
        [STORAGE_KEYS.phone, phone.trim()],
        [STORAGE_KEYS.avatar, avatar || ''],
        [
          STORAGE_KEYS.notifications,
          JSON.stringify(notifications),
        ],
      ]);

      Alert.alert('Success', 'Your profile has been saved!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Unable to save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await onLogout();
            } catch (error) {
              Alert.alert('Error', 'Unable to log out.');
            }
          },
        },
      ]
    );
  };

  const NotificationOption = ({ label, value, onPress }) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <View
        style={[
          styles.checkbox,
          value && styles.checkboxChecked,
        ]}
      >
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#495E57" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>🍋</Text>
          <Text style={styles.headerTitle}>LITTLE LEMON</Text>
        </View>

        <Text style={styles.pageTitle}>Personal information</Text>

        {/* Avatar */}
        <Text style={styles.sectionLabel}>Avatar</Text>

        <View style={styles.avatarRow}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initials}>
                {getInitials()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.changeButton}
            onPress={pickImage}
          >
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeImage}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>

        {/* Personal information */}
        <Text style={styles.label}>First name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          maxLength={50}
        />

        <Text style={styles.label}>Last name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          maxLength={50}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Phone number (USA)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="(555) 234-5678"
          keyboardType="phone-pad"
          maxLength={20}
        />

        {!isPhoneValid && (
          <Text style={styles.errorText}>
            Enter a valid US phone number.
          </Text>
        )}

        {/* Email notifications */}
        <Text style={styles.sectionTitle}>
          Email notifications
        </Text>

        <NotificationOption
          label="Order statuses"
          value={notifications.orderStatuses}
          onPress={() => toggleNotification('orderStatuses')}
        />

        <NotificationOption
          label="Password changes"
          value={notifications.passwordChanges}
          onPress={() => toggleNotification('passwordChanges')}
        />

        <NotificationOption
          label="Special offers"
          value={notifications.specialOffers}
          onPress={() => toggleNotification('specialOffers')}
        />

        <NotificationOption
          label="Newsletter"
          value={notifications.newsletter}
          onPress={() => toggleNotification('newsletter')}
        />

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        {/* Save changes */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isSaving) && styles.disabledButton,
          ]}
          onPress={saveChanges}
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 45,
  },
  header: {
    height: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 25,
  },
  headerLogo: {
    fontSize: 32,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#495E57',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 15,
    color: '#495E57',
    fontWeight: '600',
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initials: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changeButton: {
    backgroundColor: '#495E57',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 7,
    marginRight: 10,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  removeButton: {
    borderWidth: 1,
    borderColor: '#495E57',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 7,
  },
  removeButtonText: {
    color: '#495E57',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495E57',
    marginBottom: 7,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#A9B3BA',
    borderRadius: 8,
    paddingHorizontal: 13,
    fontSize: 16,
    color: '#333333',
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#B00020',
    marginTop: -12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 12,
    marginBottom: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#495E57',
    borderRadius: 5,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#495E57',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333333',
  },
  logoutButton: {
    backgroundColor: '#F4CE14',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 18,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333',
  },
  saveButton: {
    backgroundColor: '#495E57',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
