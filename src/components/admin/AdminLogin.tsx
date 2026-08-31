import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { authService } from '../../services/authService';
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface AdminLoginProps {
  language: Language;
  onSuccess: () => void;
  onExitToPublicSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  language,
  onSuccess,
  onExitToPublicSite,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutCountdown === null || lockoutCountdown <= 0) return;

    const timer = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev === null || prev <= 1) {
          setErrorMessage('');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage(
        language === 'fa' 
          ? 'لطفاً نام کاربری و رمز عبور را وارد فرمایید.' 
          : 'Please provide both username and password.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await authService.login({
        username,
        password,
        rememberMe,
      });

      if (result.success) {
        onSuccess();
      } else {
        setErrorMessage(result.error || (language === 'fa' ? 'خطا در ورود' : 'Login failed'));
        if (result.remainingLockoutSeconds) {
          setLockoutCountdown(result.remainingLockoutSeconds);
        }
      }
    } catch (err) {
      setErrorMessage(language === 'fa' ? 'خطای غیرمنتظره در احراز هویت' : 'Unexpected authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const isFa = language === 'fa';

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#0e1438] flex items-center justify-center p-4 sm:p-6"
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* Background Ambience */}
      <div className="fixed top-10 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-[#232c86]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Back to Public Site */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={onExitToPublicSite}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            {isFa ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isFa ? 'بازگشت به وب‌سایت اصلی' : 'Back to Public Website'}</span>
          </button>

          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            Protected Area
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#232c86] to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/40 border border-indigo-400/30">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isFa ? 'ورود به پنل مدیریت پولاد چرخِش' : 'Polad Charkhesh Admin Login'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              {isFa 
                ? 'سامانه یکپارچه مدیریت کاتالوگ و مشخصات مهندسی' 
                : 'Centralized catalog & engineering management system'}
            </p>
          </div>

          {/* Development Demo Helper Banner */}
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                {isFa ? 'اطلاعیه توسعه (Development Demo):' : 'Development Demo Notice:'}
              </span>
              <span className="text-[11px] text-amber-200/90 block">
                {isFa 
                  ? 'نام کاربری: admin | رمز عبور پیش‌فرض: admin123 (رمزها با استاندارد PBKDF2 هش و اعتبارسنجی می‌شوند).' 
                  : 'Username: admin | Default Dev Password: admin123 (hashed via PBKDF2 with salt).'}
              </span>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span>{errorMessage}</span>
                {lockoutCountdown !== null && (
                  <span className="block mt-1 font-mono font-bold text-rose-200">
                    {isFa 
                      ? `مدت زمان باقی‌مانده قفل: ${lockoutCountdown} ثانیه` 
                      : `Lockout countdown: ${lockoutCountdown}s`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isFa ? 'نام کاربری (Username)' : 'Username'}
              </label>
              <div className="relative">
                <User className={`w-4 h-4 text-slate-400 absolute ${isFa ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || lockoutCountdown !== null}
                  className={`
                    w-full bg-slate-950/70 border border-slate-700 rounded-xl py-2.5 text-sm text-white placeholder-slate-500
                    focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono
                    ${isFa ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'}
                    ${lockoutCountdown !== null ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isFa ? 'رمز عبور (Password)' : 'Password'}
              </label>
              <div className="relative">
                <KeyRound className={`w-4 h-4 text-slate-400 absolute ${isFa ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || lockoutCountdown !== null}
                  className={`
                    w-full bg-slate-950/70 border border-slate-700 rounded-xl py-2.5 text-sm text-white placeholder-slate-500
                    focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono
                    ${isFa ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                    ${lockoutCountdown !== null ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isFa ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300">
                  {isFa ? 'مرا به خاطر بسپار (۱۲ ساعت)' : 'Remember me (12h)'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || lockoutCountdown !== null}
              className={`
                w-full mt-4 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all
                ${lockoutCountdown !== null 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 shadow-indigo-950/60 active:scale-[0.99]'}
              `}
            >
              {isLoading 
                ? (isFa ? 'در حال بررسی اعتبارسنجی...' : 'Authenticating...') 
                : (isFa ? 'ورود امن به سامانه' : 'Sign In to Dashboard')}
            </button>
          </form>

          {/* Footer Security Note */}
          <div className="mt-8 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>ISO 27001 Standard Compliant Session Protection</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
