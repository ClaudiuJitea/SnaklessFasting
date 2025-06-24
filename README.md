# SnaklessFasting - Intermittent Fasting Tracker

A comprehensive React Native mobile application for tracking intermittent fasting with beautiful UI, detailed statistics, and achievement system. Built with Expo and modern React Native technologies.

<div align="center">
  <!-- Top centered icon -->
  <img src="https://raw.githubusercontent.com/ClaudiuJitea/SnaklessFasting/main/assets/icon.png" alt="App Icon" width="128" style="margin: 20px 0;" />

  <!-- First row of 3 images -->
  <div style="display: flex; justify-content: center; gap: 10px; margin: 10px 0;">
    <img src="https://github.com/user-attachments/assets/720eeaa9-0a55-41c1-abd2-1502db1be478" alt="IMG-20250622-WA0007" width="200">
    <img src="https://github.com/user-attachments/assets/fc17c0f6-51f0-4c08-a31a-a26ceaa8466e" alt="IMG-20250622-WA0008" width="200">
    <img src="https://github.com/user-attachments/assets/7c6c0cf9-4d29-4431-b94b-50d20332d4de" alt="IMG-20250622-WA0006" width="200">
  </div>

  <!-- Second row of 3 images -->
  <div style="display: flex; justify-content: center; gap: 10px; margin: 10px 0;">
    <img src="https://github.com/user-attachments/assets/cb2a0956-9bc9-45bd-8cdf-bb1644fe3c63" alt="IMG-20250622-WA0004" width="200">
    <img src="https://github.com/user-attachments/assets/494ad788-b7df-4a46-9b1c-c26d3743aee3" alt="IMG-20250622-WA0005" width="200">
    <img src="https://github.com/user-attachments/assets/c27d8467-43ab-4dbc-b5e1-345b389e278d" alt="IMG-20250622-WA0003" width="200">
  </div>
</div>

## ✨ Features

🕐 **Smart Fasting Timer**: Track your fasting sessions with real-time circular progress indicators
📊 **Detailed Statistics**: Visualize your fasting progress with interactive charts and analytics
🏆 **Achievement System**: Unlock achievements as you reach fasting milestones
⚖️ **Weight Tracking**: Monitor your weight progress with visual charts
💧 **Hydration Tracking**: Track daily water intake with progress indicators
👤 **User Profiles**: Manage personal information and fasting preferences
🎯 **Fasting Presets**: Choose from popular intermittent fasting schedules (16:8, 18:6, 20:4, etc.)
📱 **Cross-Platform**: Works seamlessly on both iOS and Android devices
🌍 **Multi-Language Support**: Available in multiple languages with i18n
🌙 **Modern UI**: Beautiful interface with smooth animations and intuitive design
📈 **Progress Tracking**: Monitor daily, weekly, and monthly fasting progress
🔒 **Local Storage**: All data stored securely on your device with SQLite

## 🛠 Technology Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: Zustand
- **Database**: Expo SQLite (Local storage)
- **Charts**: React Native Chart Kit with SVG
- **Icons**: Expo Vector Icons & React Native Vector Icons
- **Internationalization**: i18next & react-i18next
- **Date Management**: Day.js
- **Storage**: AsyncStorage for app preferences
- **Animations**: React Native Animated API

## 📋 Prerequisites

- Node.js 18 or higher
- npm or Yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/ClaudiuJitea/SnaklessFasting.git
cd SnaklessFasting
```

2. **Install dependencies**
```bash
# Using npm
npm install

# Using yarn
yarn install
```

3. **Configure the app**
```bash
# Update app.json with your project details
# Set your EAS project ID and Android package name
```

4. **Start the development server**
```bash
# Using npm
npm start

# Using yarn
yarn start

# Or start directly with Expo
npx expo start
```

5. **Run on device/simulator**
```bash
# iOS Simulator (macOS only)
npx expo run:ios

# Android Emulator
npx expo run:android

# Or scan QR code with Expo Go app
```

## ⚙️ Configuration

### App Configuration
Update the following files with your project details:

**app.json**
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "android": {
      "package": "com.yourcompany.yourapp"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### EAS Build Configuration
The app includes EAS configuration for building and deploying:
- Development builds with development client
- Preview builds for internal testing
- Production builds with auto-increment

## 📱 Usage

### Getting Started
1. **Launch the App**: Open the app on your device or simulator
2. **Welcome Screen**: Complete the initial onboarding
3. **Start Fasting**: Choose a fasting preset or create custom schedule
4. **Track Progress**: Monitor your fasting timer and statistics
5. **Log Data**: Record weight and hydration data
6. **Earn Achievements**: Unlock rewards as you progress

### Core Features

#### 🕐 Fasting Timer
- **Real-time Tracking**: Live countdown with circular progress indicator
- **Fasting Presets**: Popular schedules like 16:8, 18:6, 20:4, OMAD
- **Custom Schedules**: Create personalized fasting windows
- **Session Management**: Start, pause, and end fasting sessions

#### 📊 Statistics & Analytics
- **Progress Charts**: Visual representation of fasting trends
- **Weekly/Monthly Views**: Analyze patterns over time
- **Streak Tracking**: Monitor consecutive fasting days
- **Success Rates**: Track completion percentages

#### ⚖️ Weight Management
- **Weight Logging**: Easy weight entry with date tracking
- **Progress Visualization**: Charts showing weight trends
- **Goal Setting**: Set and track weight targets
- **BMI Calculation**: Automatic BMI tracking

#### 💧 Hydration Tracking
- **Water Goals**: Set daily hydration targets
- **Quick Logging**: Fast buttons for common serving sizes
- **Progress Indicators**: Visual progress tracking
- **Daily Summaries**: Review hydration achievements

#### 🏆 Achievement System
- **Milestone Rewards**: Unlock achievements for various accomplishments
- **Progress Tracking**: See your journey towards next achievements
- **Motivation**: Gamified experience to maintain consistency

## 🏗️ Project Structure

```
SnaklessFastingApp/
├── App.js                    # Main app component
├── app.json                  # Expo configuration
├── package.json              # Dependencies and scripts
├── assets/                   # App icons and images
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
├── database/                 # SQLite database operations
│   └── database.js
├── i18n/                     # Internationalization
│   ├── index.js
│   └── locales/
│       ├── en.json
│       └── ro.json
├── navigation/               # Navigation configuration
│   └── AppNavigator.js
├── screens/                  # App screens
│   ├── FastingScreen.js      # Main fasting timer
│   ├── StatsScreen.js        # Statistics and charts
│   ├── ProfileScreen.js      # User profile management
│   ├── AchievementsScreen.js # Achievement tracking
│   ├── WeightEntryScreen.js  # Weight logging
│   └── WelcomeScreen.js      # Onboarding screen
├── store/                    # State management
│   └── useStore.js           # Zustand store
└── services/                 # External services (if any)
```

## 🌍 Internationalization

The app supports multiple languages:
- English (en)
- Romanian (ro)

To add a new language:
1. Create a new JSON file in `i18n/locales/`
2. Add translations for all keys
3. Update the i18n configuration

## 🔒 Privacy & Data

- **Local Storage**: All data is stored locally on your device using SQLite
- **No Cloud Sync**: Your personal data never leaves your device
- **Open Source**: Built with transparency and privacy in mind
- **No Analytics**: No tracking or data collection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Icons by [Expo Vector Icons](https://icons.expo.fyi/)
- Charts powered by [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit)
- Internationalization with [i18next](https://www.i18next.com/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Happy Fasting! 🕐✨**
