import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockDatabase';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  users: User[];
  login: (email: string) => boolean;
  register: (fullName: string, email: string, role: UserRole, studentStaffId?: string) => User;
  activeRole: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('smart_cafeteria_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    return users.find(u => u.role === 'customer') || users[0];
  });

  useEffect(() => {
    localStorage.setItem('smart_cafeteria_users', JSON.stringify(users));
  }, [users]);

  const switchRole = (role: UserRole) => {
    const match = users.find(u => u.role === role);
    if (match) {
      setCurrentUser(match);
    } else {
      const newUser: User = {
        id: Date.now(),
        fullName: role === 'kitchen_staff' ? 'Kitchen Chef' : role === 'admin' ? 'Admin Manager' : 'Student Customer',
        email: `${role}@campus.edu`,
        role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
    }
  };

  const login = (email: string): boolean => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const register = (fullName: string, email: string, role: UserRole, studentStaffId?: string): User => {
    const newUser: User = {
      id: Date.now(),
      fullName,
      email,
      role,
      studentStaffId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return newUser;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      switchRole,
      users,
      login,
      register,
      activeRole: currentUser.role
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
