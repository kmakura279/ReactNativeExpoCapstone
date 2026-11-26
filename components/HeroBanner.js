
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

export default function HeroBanner({
  searchText,
  onSearchChange,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.introRow}>
        <View style={styles.introText}>
          <Text style={styles.title}>Little Lemon</Text>
          <Text style={styles.subtitle}>Chicago</Text>

          <Text style={styles.description}>
            We are a family owned Mediterranean restaurant,
            focused on traditional recipes served with a
            modern twist.
          </Text>
        </View>

        <View style={styles.imagePlaceholder}>
          <Text style={styles.foodEmoji}>🥗</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search menu..."
          placeholderTextColor="#68746E"
          value={searchText}
          onChangeText={onSearchChange}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search menu dishes"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#495E57',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 22,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  introText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#F4CE14',
  },
  subtitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: -5,
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  imagePlaceholder: {
    width: 110,
    height: 125,
    borderRadius: 12,
    backgroundColor: '#344A42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodEmoji: {
    fontSize: 65,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEFEE',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 14,
  },
  searchIcon: {
    fontSize: 28,
    color: '#495E57',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    height: '100%',
  },
});
