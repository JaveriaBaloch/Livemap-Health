import { create } from "zustand";
import { IUser, IChat, IEmergency, MapCenter } from "@/types";

interface AppState {
  // Auth
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  
  // Location
  currentLocation: MapCenter | null;
  setCurrentLocation: (loc: MapCenter) => void;
  getCurrentLocation: () => void;
  
  // Emergency
  activeEmergency: IEmergency | null;
  setActiveEmergency: (e: IEmergency | null) => void;
  
  // Chat
  chats: IChat[];
  setChats: (chats: IChat[]) => void;
  activeChat: IChat | null;
  setActiveChat: (chat: IChat | null) => void;
  
  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  mapCenter: MapCenter;
  setMapCenter: (center: MapCenter) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  currentLocation: null,
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  
  getCurrentLocation: () => {
    if (!navigator.geolocation) {
      // Default to Potsdam
      set({ currentLocation: { lat: 52.3906, lng: 13.0645 } });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        set({ currentLocation: location });
      },
      (error) => {
        console.error("Error getting location:", error);
        // Default to Potsdam
        set({ currentLocation: { lat: 52.3906, lng: 13.0645 } });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  },
  
  activeEmergency: null,
  setActiveEmergency: (e) => set({ activeEmergency: e }),
  
  chats: [],
  setChats: (chats) => set({ chats }),
  activeChat: null,
  setActiveChat: (chat) => set({ activeChat: chat }),
  
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  mapCenter: { lat: 52.3906, lng: 13.0645 }, // Potsdam default
  setMapCenter: (center) => set({ mapCenter: center }),
}));
