
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadMenu } from '../database/menuDatabase';

const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/images/';

export default function Home({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState(null);

  const loadHome = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [name, surname, savedAvatar] =
        await AsyncStorage.multiGet([
          'firstName',
          'lastName',
          'avatarImage',
        ]);

      setFirstName(name[1] || '');
      setLastName(surname[1] || '');
      setAvatar(savedAvatar[1] || null);

      const items = await loadMenu();
      setMenuItems(items);
    } catch (err) {
      console.error('Home loading error:', err);
      setError(
        'Unable to load the menu. Check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reload profile avatar when returning from Profile
  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [])
  );

  const initials =
    (
      firstName.trim().charAt(0) +
      lastName.trim().charAt(0)
    ).toUpperCase() || '?';

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuDetails}>
        <Text style={styles.itemName}>{item.name}</Text>

        <Text style={styles.itemDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <Text style={styles.itemPrice}>
          ${Number(item.price).toFixed(2)}
        </Text>
      </View>

      <Image
        source={{
          uri: `${IMAGE_BASE_URL}${encodeURIComponent(item.image)}`,
        }}
        style={styles.foodImage}
      />
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <Text style={styles.lemonIcon}>🍋</Text>
          <Text style={styles.brandName}>LITTLE LEMON</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Open profile"
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.profileAvatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {initials}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Little Lemon Menu
        </Text>
        <Text style={styles.sectionSubtitle}>
          Fresh Mediterranean dishes made with love.
        </Text>
      </View>

      <Text style={styles.menuHeading}>
        Our Menu
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#495E57"
          />
          <Text style={styles.loadingText}>
            Loading menu...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadHome}
          >
            <Text style={styles.retryText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMenuItem}
          ListHeaderComponent={renderHeader}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No menu items available.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 35,
  },
  header: {
    height: 80,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lemonIcon: {
    fontSize: 29,
    marginRight: 8,
  },
  brandName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#495E57',
    letterSpacing: 2,
  },
  profileAvatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionHeader: {
    backgroundColor: '#495E57',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#F4CE14',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 25,
  },
  menuHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  menuDetails: {
    flex: 1,
    paddingRight: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 7,
  },
  itemDescription: {
    fontSize: 14,
    color: '#777777',
    lineHeight: 20,
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#495E57',
  },
  foodImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#E5E5E5',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  loadingText: {
    fontSize: 16,
    color: '#495E57',
    marginTop: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#495E57',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777777',
    marginTop: 30,
  },
});
