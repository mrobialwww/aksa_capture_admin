import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
    name: string;
    gender: string;
    setUser: (name: string, gender: string) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            name: "",
            gender: "",
            setUser: (name, gender) => set({ name, gender }),
            clearUser: () => set({ name: "", gender: "" }),
        }),
        {
            name: "aksa-user-storage",
        },
    ),
);
