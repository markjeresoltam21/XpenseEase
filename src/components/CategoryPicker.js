// Category Picker Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../constants/categories';
import { COLORS, SIZES } from '../constants/theme';

const CategoryPicker = ({ selectedCategory, onSelectCategory }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                { borderColor: category.color },
                isSelected && { backgroundColor: category.color + '20', borderWidth: 2 }
              ]}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: category.color + '30' }]}>
                <Ionicons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={[
                styles.categoryName,
                isSelected && { color: category.color, fontWeight: '600' }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: SIZES.borderRadius,
    marginRight: 12,
    minWidth: 90,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: SIZES.small,
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default CategoryPicker;
