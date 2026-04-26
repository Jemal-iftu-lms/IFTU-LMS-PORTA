
import React from 'react';
import { User } from '../types';

interface RoleGuardProps {
  currentUser: User | null;
  allowedRoles: Array<'student' | 'teacher' | 'admin' | 'teaching_assistant' | 'content_creator' | 'guest_user'>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * RoleGuard component to restrict UI elements based on user roles.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ 
  currentUser, 
  allowedRoles, 
  fallback = null, 
  children 
}) => {
  if (!currentUser) return <>{fallback}</>;
  
  const hasAccess = allowedRoles.includes(currentUser.role);
  
  if (!hasAccess) return <>{fallback}</>;
  
  return <>{children}</>;
};

export default RoleGuard;
