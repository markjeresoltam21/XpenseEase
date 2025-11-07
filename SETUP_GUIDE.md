# 🚀 XpenseEase - Setup Guide for Expo Go

## ✅ Quick Start (Expo Go)

### 1. Install Dependencies
```powershell
npm install
```

### 2. Enable Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com/project/xpenseease)
2. Click **Firestore Database** in left sidebar
3. Click **Create database**
4. Select **Start in test mode** (for development)
5. Choose location closest to you
6. Click **Enable**

### 3. Start the App
```powershell
npm start
```

### 4. Run on Your Phone
1. Install **Expo Go** app from:
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)
   - [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS)

2. Open Expo Go app

3. Scan the QR code shown in your terminal/browser

4. Wait for the app to load (first time may take a minute)

## 📱 Testing the App

Once loaded, you should see:
1. **Home Screen** - Dashboard with budget overview
2. **Bottom Navigation** - Home, Expenses, Reports tabs
3. **Floating + Button** - Add new expenses

## 🔧 Troubleshooting

### "Firestore not enabled" error
- Go to Firebase Console and enable Firestore Database (see step 2 above)

### "Network error" 
- Make sure your phone and computer are on the same WiFi network
- Check Firebase configuration in `config/firebase.config.js`

### App won't load
- Clear Expo Go cache: Shake phone → "Clear cache"
- Restart: Press `r` in terminal to reload

### Metro bundler issues
- Press `r` to reload
- Press `c` to clear cache
- Stop and run `npm start` again

## 📝 First Steps in the App

1. **Set Your Budget**
   - Tap the settings icon or "Set Your Budget" card
   - Enter weekly budget (e.g., ₱1000)
   - Enter monthly budget (e.g., ₱4000)
   - Tap "Set Budget"

2. **Add Your First Expense**
   - Tap the blue **+** button
   - Enter amount (e.g., 150)
   - Select category (Food, Transport, etc.)
   - Add description (optional)
   - Tap "Add Expense"

3. **View Reports**
   - Go to **Reports** tab
   - See pie charts and bar graphs
   - Switch between "This Week" and "This Month"

## 🎯 Features to Test

- ✅ Add expenses with different categories
- ✅ View expense list
- ✅ Delete expenses (swipe or tap trash icon)
- ✅ Set and update budget
- ✅ View spending analytics
- ✅ Check budget progress bar

## 📊 Sample Test Data

Try adding these expenses to see the app in action:
- ₱120 - Food - "Lunch at cafeteria"
- ₱50 - Transport - "Jeepney fare"
- ₱250 - School - "Notebook and pen"
- ₱100 - Entertainment - "Movie ticket"

## 🔥 Firebase Collections

The app creates these Firestore collections:
- `expenses` - All expense records
- `budgets` - User budget settings

You can view them in Firebase Console → Firestore Database

## 💡 Tips

- Pull down to refresh data on any screen
- The app syncs in real-time with Firebase
- Data persists even if you close the app
- Budget progress updates automatically

Enjoy tracking your expenses! 📱💰
