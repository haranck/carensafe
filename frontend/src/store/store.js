import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
// Custom storage wrapper — fixes Vite ESM/CJS resolution issue with redux-persist/lib/storage
const storage = {
    getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(window.localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(window.localStorage.removeItem(key)),
};

import authReducer from "./slices/authSlice";
import tokenReducer from "./slices/tokenSlice";
import adminSessionReducer from "./slices/adminSessionSlice";

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth", "token", "adminSession"], // sessions survive page reloads
};

const rootReducer = combineReducers({
    auth: authReducer,
    token: tokenReducer,
    adminSession: adminSessionReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for redux-persist
                ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/REGISTER"],
            },
        }),
});

export const persistor = persistStore(store);
