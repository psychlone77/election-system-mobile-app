# Election System Mobile App

A secure, modern mobile voting application built with React Native and Expo, featuring end-to-end encryption, biometric authentication, and a seamless user experience.

## Related Repositories

- [Election System Core](https://github.com/psychlone77/election-system-core)
- [Election System Admin Panel](https://github.com/psychlone77/election-system-admin-panel)

## Overview

This mobile application provides a complete election system that allows users to:
- **Register** securely using National ID and initialization codes
- **Authenticate** using PIN or biometric authentication (fingerprint/face recognition)
- **Vote** for candidates in a secure and encrypted manner
- **Verify** voter eligibility and voting status
- **Manage** profile and security settings

## Key Features

### Security
- **Ed25519 Cryptographic Keypairs** - Generated on registration for secure signing
- **Secure Key Storage** - Private keys stored using SecureStore (native) or localStorage (web)
- **PIN Protection** - 4-6 digit PIN with salted hashing
- **Biometric Authentication** - Optional fingerprint/face recognition support
- **Blind RSA Signatures** - Privacy-preserving vote submission

### User Management
- Smart registration detection and flow
- PIN creation and management
- Biometric enrollment and toggle
- Profile dashboard with account information
- Secure logout with session management

### User Interface
- Clean, modern design with purple accent theme
- Intuitive navigation and form validation
- Toast notifications for user feedback
- Loading states and error handling
- Responsive layout for all screen sizes

## 📱 Screenshots

### Registration Screen
<img width="299" height="639" alt="image" src="https://github.com/user-attachments/assets/8e51f271-7aa0-4e02-a3f4-f044a1ed2a48" />


### Voting Screen
<img width="258" height="551" alt="image" src="https://github.com/user-attachments/assets/0b625194-55ea-4423-8ef4-dc5272410e87" />


### Verification Screen
<img width="281" height="601" alt="image" src="https://github.com/user-attachments/assets/afd78fa8-3b61-4996-92ff-0e84f961e677" />


## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Clone the repository
```bash
git clone https://github.com/psychlone77/election-system-mobile-app.git
cd election-system-mobile-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables Create a .env file in the root directory with your API configuration:
```bash
API_BASE_URL=your_api_url_here
```

4. Development Commands
Start Development Server
```bash
npm start
```
