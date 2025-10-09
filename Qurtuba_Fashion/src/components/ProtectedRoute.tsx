import React from 'react';
import { authService } from '@/services/auth.service';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // If not authenticated, show login page
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage 
        onLogin={(user) => {
          // This will be handled by the parent component
          window.location.reload();
        }} 
      />
    );
  }

  // If role is required, check if user has the required role
  if (requiredRole && !authService.hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F6E9CA] to-[#C69A72]">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-[#13312A] arabic-text mb-4">
            غير مصرح لك بالوصول
          </h2>
          <p className="text-[#155446] arabic-text mb-6">
            ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة.
          </p>
          <p className="text-sm text-gray-600 arabic-text">
            المطلوب: {requiredRole}
          </p>
          <p className="text-sm text-gray-600 arabic-text">
            صلاحيتك الحالية: {currentUser.status}
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking authentication status
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    authService.isAuthenticated()
  );
  const [currentUser, setCurrentUser] = React.useState(
    authService.getCurrentUser()
  );

  React.useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setCurrentUser(authService.getCurrentUser());
    };

    // Check auth status on mount
    checkAuth();

    // You can add event listeners here if you implement auth state changes
    // For now, we'll just check on mount
  }, []);

  return {
    isAuthenticated,
    currentUser,
    hasRole: (role: string) => authService.hasRole(role),
    isAdmin: () => authService.isAdmin(),
    logout: () => authService.logout()
  };
}
