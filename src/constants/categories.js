// Expense Categories
export const CATEGORIES = [
  {
    id: 'food',
    name: 'Food',
    icon: 'fast-food',
    color: '#10B981',
    iconFamily: 'Ionicons'
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'car',
    color: '#6EE7B7',
    iconFamily: 'Ionicons'
  },
  {
    id: 'school',
    name: 'School Supplies',
    icon: 'school',
    color: '#34D399',
    iconFamily: 'Ionicons'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'game-controller',
    color: '#059669',
    iconFamily: 'Ionicons'
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: 'bulb',
    color: '#047857',
    iconFamily: 'Ionicons'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'cart',
    color: '#6EE7B7',
    iconFamily: 'Ionicons'
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'fitness',
    color: '#10B981',
    iconFamily: 'Ionicons'
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'ellipsis-horizontal',
    color: '#34D399',
    iconFamily: 'Ionicons'
  }
];

export const getCategoryById = (id) => {
  return CATEGORIES.find(cat => cat.id === id) || CATEGORIES[CATEGORIES.length - 1];
};
