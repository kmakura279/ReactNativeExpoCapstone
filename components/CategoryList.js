
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

const CATEGORIES = [
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Mains' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'specials', label: 'Specials' },
];

export default function CategoryList({
  selectedCategories,
  onChange,
}) {
  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      onChange(
        selectedCategories.filter((item) => item !== category)
      );
    } else {
      onChange([...selectedCategories, category]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>ORDER FOR DELIVERY!</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((category) => {
          const isSelected =
            selectedCategories.includes(category.id);

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              style={[
                styles.categoryButton,
                isSelected && styles.selectedButton,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.selectedText,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 18,
    marginBottom: 18,
  },
  categories: {
    paddingHorizontal: 18,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#EDEFEE',
  },
  selectedButton: {
    backgroundColor: '#495E57',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495E57',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});

