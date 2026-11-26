
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

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

import HeroBanner from '../components/HeroBanner';
import CategoryList from '../components/CategoryList';

import {
  loadMenu,
  filterMenuItems,
} from '../database/menuDatabase';

const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/images/';

export default function Home({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] =
    useState([]);

  const [databaseReady, setDatabaseReady] = useState(false);

  // Ignore results from older queries if filters change rapidly.
  const queryId = useRef(0);

  // Load menu from SQLite (or fetch once if database is empty).
  useEffect(() => {
    let active = true;

    const initializeMenu = async () => {
      try {
        setIsLoading(true);
        setError('');

        await loadMenu();

        if (active) {
          setDatabaseReady(true);
        }
      } catch (err) {
        console.error('Menu initialization error:', err);

        if (active) {
          setError(
            'Could not load the menu. Please check your connection.'
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initializeMenu();

    return () => {
      active = false;
    };
  }, []);

  // Reload avatar when returning from Profile.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProfile = async () => {
        try {
          const values = await AsyncStorage.multiGet([
            'firstName',
            'lastName',
            'avatarImage',
          ]);

          if (!active) return;

          const data = Object.fromEntries(values);

          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setAvatar(data.avatarImage || null);
        } catch (err) {
          console.error('Profile loading error:', err);
        }
      };

      loadProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  // Debounce text search by 500ms.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Run SQLite query when category or debounced search changes.
  useEffect(() => {
    if (!databaseReady) return;

    const currentQuery = ++queryId.current;

    const applyFilters = async () => {
      try {
        const results = await filterMenuItems(
          debouncedSearch,
          selectedCategories
        );

        if (currentQuery === queryId.current) {
          setMenuItems(results);
          setError('');
        }
      } catch (err) {
        console.error('Filtering error:', err);

        if (currentQuery === queryId.current) {
          setError('Unable to filter menu items.');
        }
      }
    };

    applyFilters();

    return () => {
      queryId.current++;
    };
  }, [databaseReady, debouncedSearch, selectedCategories]);

  const retryLoading = async () => {
    try {
      setIsLoading(true);
      setError('');

      await loadMenu();

      setDatabaseReady(true);

      // Refresh current filters after a successful retry.
      const results = await filterMenuItems(
        debouncedSearch,
        selectedCategories
      );

      setMenuItems(results);
    } catch (err) {
      console.error('Retry error:', err);
      setError('Could not load menu. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initials =
    (
      firstName.trim().charAt(0) +
      lastName.trim().charAt(0)
    ).toUpperCase() || '?';

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuDetails}>
        <Text style={styles.itemName}>{item.name}</Text>

        <Text
          style={styles.itemDescription}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        <Text style={styles.itemPrice}>
          ${Number(item.price).toFixed(2)}
        </Text>
      </View>

      <Image
        source={{
          uri:
            IMAGE_BASE_URL +
            encodeURIComponent(item.image),
        }}
        style={styles.foodImage}
      />
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Text style={styles.logo}>🍋</Text>
          <Text style={styles.brandText}>LITTLE LEMON</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Open profile"
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {initials}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <HeroBanner
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      <CategoryList
        selectedCategories={selectedCategories}
        onChange={setSelectedCategories}
      />

      <View style={styles.divider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMenuItem}
        ListHeaderComponent={renderHeader}
        extraData={{
          searchText,
          selectedCategories,
          avatar,
          firstName,
          lastName,
        }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View style={styles.itemDivider} />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator
                size="large"
                color="#495E57"
              />
              <Text style={styles.message}>
                Loading menu...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={retryLoading}
              >
                <Text style={styles.retryText}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No dishes match your filters.
            </Text>
          )
        }
      />
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
    height: 76,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    marginRight: 9,
  },
  brandText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#495E57',
    letterSpacing: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#495E57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#D5D9D6',
    marginHorizontal: 18,
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  menuDetails: {
    flex: 1,
    paddingRight: 14,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 7,
  },
  itemDescription: {
    fontSize: 14,
    color: '#697A73',
    lineHeight: 20,
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495E57',
  },
  foodImage: {
    width: 95,
    height: 95,
    borderRadius: 8,
    backgroundColor: '#EDEFEE',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#EDEFEE',
    marginHorizontal: 18,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 35,
  },
  message: {
    color: '#495E57',
    marginTop: 12,
  },
  errorText: {
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 18,
  },
  retryButton: {
    backgroundColor: '#495E57',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#697A73',
    textAlign: 'center',
    marginTop: 30,
  },
});
