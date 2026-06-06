# Kamilstore Mobile

React Native (Expo + TypeScript) e-commerce app sharing the same backend
(`Kamilstore_backend`) and visual language as the web storefront.

## Quick start

```bash
cd mobileApp
npm install
npx expo install   # ensures native modules match the SDK
npm start
```

Press `a` for Android emulator, `i` for iOS simulator, or scan the QR
code with the Expo Go app on your phone.

## API base URL

The app talks to the backend at `EXPO_PUBLIC_API_URL` (env), falling
back to `app.json > extra.apiUrl` (`http://10.0.2.2:5000` for Android
emulator). To use a real device on the same Wi-Fi, set:

```bash
# Windows PowerShell
$env:EXPO_PUBLIC_API_URL="http://192.168.X.X:5000"; npm start
```

## Folder layout

```
src/
├── api/          REST clients (auth, products, categories, cart, wishlist)
├── components/   Reusable UI (ProductCard, PrimaryButton, SearchBar, ...)
├── context/      App-wide state (Auth, Cart, Wishlist) + AsyncStorage
├── navigation/   Root + tab navigators, route types
├── screens/      One file per screen (Home, Products, Cart, ...)
├── theme/        Colors, spacing, typography
├── types/        Shared TS types
└── utils/        Formatters, storage helpers
```

## Theme

Mirrors the web frontend:
- Primary `#F97316` (orange-500), hover `#EA580C`
- Surface `#FFFFFF`, app bg `#F9FAFB` (gray-50)
- Text scale on `#111827 / #4B5563 / #9CA3AF`
- Wishlist accent `#F43F5E` (rose-500)
- Discount badge `#E11D48` (rose-600)

## Backend endpoints used

`GET /api/public/products`, `GET /api/public/products/:slug`,
`GET /api/public/categories`, `POST /api/auth/login`,
`POST /api/auth/register`, `GET /api/auth/me`,
`GET|POST|PUT|DELETE /api/cart(/items)`, `GET|POST|PUT|DELETE /api/wishlist(/items)`.
