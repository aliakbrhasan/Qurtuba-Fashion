import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Scissors, Loader2, AlertCircle } from 'lucide-react';
import { authService, LoginCredentials } from '@/services/auth.service';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for remembered login on component mount
  useEffect(() => {
    const checkRememberedLogin = async () => {
      try {
        const remembered = localStorage.getItem('qurtuba_remember');
        if (remembered === 'true') {
          const storedAuth = localStorage.getItem('qurtuba_auth');
          if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            // Check if stored data is not too old (30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (authData.timestamp > thirtyDaysAgo) {
              // Auto login with stored user
              onLogin(authData.user);
              return;
            } else {
              // Clear expired data
              localStorage.removeItem('qurtuba_auth');
              localStorage.removeItem('qurtuba_remember');
            }
          }
        }
      } catch (error) {
        console.error('Error checking remembered login:', error);
        // Clear corrupted data
        localStorage.removeItem('qurtuba_auth');
        localStorage.removeItem('qurtuba_remember');
      }
    };

    checkRememberedLogin();
  }, [onLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const credentials: LoginCredentials = {
        email: email.trim(),
        password,
        rememberMe
      };

      const result = await authService.login(credentials);

      if (result.success && result.user) {
        toast.success(`مرحباً ${result.user.name}! تم تسجيل الدخول بنجاح`);
        onLogin(result.user);
      } else {
        setError(result.error || 'فشل في تسجيل الدخول');
        toast.error(result.error || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
      toast.error('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F6E9CA] to-[#C69A72]">
      <Card className="w-full max-w-md bg-[#F6E9CA] border-[#C69A72] shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#13312A] rounded-full flex items-center justify-center">
              <Scissors className="w-8 h-8 text-[#F6E9CA]" />
            </div>
          </div>
          <CardTitle className="text-2xl text-[#13312A] arabic-text">
            نظام خياطة قرطبة
          </CardTitle>
          <p className="text-[#155446] arabic-text">مرحباً بك، يرجى تسجيل الدخول</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 space-x-reverse p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 arabic-text text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#13312A] arabic-text">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="أدخل البريد الإلكتروني"
                className="bg-white border-[#C69A72] focus:border-[#155446] text-right touch-target"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#13312A] arabic-text">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                placeholder="أدخل كلمة المرور"
                className="bg-white border-[#C69A72] focus:border-[#155446] text-right touch-target"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                className="border-[#155446] data-[state=checked]:bg-[#155446]"
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-[#13312A] arabic-text cursor-pointer">
                تذكرني
              </Label>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] py-3 touch-target arabic-text transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <a href="#" className="text-[#155446] hover:text-[#13312A] arabic-text text-sm">
              نسيت كلمة المرور؟
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}