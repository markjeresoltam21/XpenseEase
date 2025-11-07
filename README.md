# 📱 XpenseEase – Student Budget Tracker

A mobile budgeting and expense tracking app designed specifically for students to manage their limited finances effectively.

## 🎯 Features

- ✅ **Add Expenses** – Track daily spending with categories
- 📊 **Visual Reports** – Pie charts and bar charts for spending analysis
- 💰 **Budget Management** – Set weekly/monthly budgets
- 📈 **Progress Tracking** – Monitor remaining balance in real-time
- 📝 **Expense History** – View all transactions
- 🎨 **Category-based Tracking** – Food, Transport, School Supplies, etc.
- ☁️ **Cloud Sync** – Firebase Firestore integration

## 🛠️ Technology Stack

- **Framework:** React Native with Expo
- **Database:** Firebase Firestore
- **Navigation:** React Navigation
- **Charts:** React Native Chart Kit
- **State Management:** React Hooks

## 📋 Prerequisites

- Node.js (v14 or higher)
- Expo CLI: `npm install -g expo-cli`
- Firebase account

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Copy your Firebase config and paste it into `config/firebase.config.js`

3. **Run the app:**
   ```bash
   npm start
   ```

4. **Launch on device:**
   - Scan QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator

## 📱 App Structure

```
XpenseEase/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js          # Dashboard with budget overview
│   │   ├── AddExpenseScreen.js    # Add new expense
│   │   ├── ExpenseListScreen.js   # View all expenses
│   │   ├── ReportsScreen.js       # Charts and analytics
│   │   └── BudgetSetupScreen.js   # Set weekly/monthly budget
│   ├── components/
│   │   ├── ExpenseCard.js         # Individual expense item
│   │   ├── CategoryPicker.js      # Category selector
│   │   └── BudgetProgressBar.js   # Visual budget indicator
│   ├── navigation/
│   │   └── AppNavigator.js        # Navigation setup
│   ├── services/
│   │   └── firestoreService.js    # Firebase CRUD operations
│   ├── constants/
│   │   ├── theme.js               # App colors and styles
│   │   └── categories.js          # Expense categories
│   └── utils/
│       └── helpers.js             # Utility functions
├── config/
│   └── firebase.config.js         # Firebase configuration
├── assets/                         # Images and icons
├── App.js                          # Entry point
└── package.json
```

## 📊 Sample Use Case

1. Student sets a **weekly budget: ₱1000**
2. Day 1: Adds ₱120 (Food) + ₱40 (Transport) → Remaining: ₱840
3. Day 2: Adds ₱250 (Books) → Remaining: ₱590
4. End of Week: View summary report
   - Total spent: ₱410
   - Top category: Books (61%)
   - Savings left: ₱590

## 🎓 Target Users

- College students managing allowances
- Young professionals on tight budgets
- Anyone looking to develop financial discipline

## 📄 License

This project is open source and available for educational purposes.
