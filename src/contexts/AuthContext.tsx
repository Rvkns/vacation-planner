'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { userService } from '@/services/userService';

interface AuthContextType {
    currentUser: User | null;
    switchUser: (userId: string) => void;
    allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        const user = userService.getCurrentUser();
        const users = userService.getAllUsers();
        setCurrentUser(user);
        setAllUsers(users);
    }, []);

    const switchUser = (userId: string) => {
        userService.setCurrentUser(userId);
        const user = userService.getUserById(userId);
        if (user) {
            setCurrentUser(user);
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, switchUser, allUsers }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
