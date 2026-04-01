import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { authApi } from '@/services/api';
import type { LoginRequest } from '@/types';
import { AnimatedCharacters } from '@/components/AnimatedCharacters';
import { LanguageToggle } from '@/components/LanguageToggle';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(form);
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || t('login.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans text-gray-900">

      {/* Left side - Branding & Graphic */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 p-12 text-white overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] [background-size:20px_20px] mix-blend-overlay"></div>
        <div className="absolute top-1/4 right-1/4 size-64 bg-gray-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-gray-300/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Logo */}
        <div className="relative z-20">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-white">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <span className="tracking-tight">AeroFlow</span>
          </Link>
        </div>

        {/* Center Graphic: Four Abstract Swaying Characters */}
        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative w-[550px] h-[400px]">
            <AnimatedCharacters
              isTyping={isTyping}
              showPassword={showPassword}
              passwordLength={passwordValue.length}
            />
          </div>
        </div>

        {/* Bottom Links */}
        <div className="relative z-20 flex items-center gap-8 text-sm text-gray-200">
          <a href="#" className="hover:text-white transition-colors">{t('auth.privacyPolicy')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('auth.termsOfService')}</a>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-white relative">
        <div className="absolute right-8 top-8">
          <LanguageToggle />
        </div>
        <div className="w-full max-w-[420px]">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 text-xl font-bold mb-12">
            <div className="w-8 h-8 bg-[#0d6efd] rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <span className="tracking-tight text-gray-900">AeroFlow</span>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{t('login.welcome')}</h1>
            <p className="text-gray-500 text-sm font-medium">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl mb-6 text-sm font-semibold text-center animate-slide-up-fade">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700" htmlFor="username">{t('login.username')}</label>
              <input
                type="text"
                id="username"
                className="flex w-full rounded-full border border-gray-200 px-5 py-2 text-sm h-12 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all"
                placeholder={t('login.usernamePlaceholder')}
                autoComplete="off"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700" htmlFor="password">{t('login.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="flex w-full rounded-full border border-gray-200 px-5 py-2 pr-12 text-sm h-12 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value })
                    setPasswordValue(e.target.value)
                  }}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-gray-300 text-[#0d6efd] focus:ring-[#0d6efd]/30 cursor-pointer" />
                <label className="text-sm font-medium text-gray-600 cursor-pointer select-none" htmlFor="remember">{t('login.remember')}</label>
              </div>
              <a className="text-sm text-[#0d6efd] hover:text-blue-700 hover:underline font-bold transition-colors" href="#">{t('login.forgotPassword')}</a>
            </div>

            <button
              className="group relative cursor-pointer overflow-hidden rounded-full border border-gray-200 bg-white px-6 py-2 text-center w-full h-12 mt-6 text-sm font-bold text-gray-800 transition-all hover:border-[#0d6efd] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              <span className={`inline-block transition-all duration-300 ${loading ? '' : 'group-hover:translate-x-12 group-hover:opacity-0'}`}>
                {loading ? t('login.submitLoading') : t('login.submit')}
              </span>
              {!loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#0d6efd] text-white opacity-0 transition-all duration-300 group-hover:opacity-100 rounded-full">
                  <span>{t('login.submit')}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              )}
            </button>
          </form>

          <div className="mt-6">
            <button className="group relative cursor-pointer overflow-hidden rounded-full border border-gray-200 bg-gray-50 px-6 py-2 text-center w-full h-12 text-sm font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-100" type="button">
              <div className="flex items-center justify-center gap-2 w-full h-full transition-all duration-300 group-hover:-translate-y-12 group-hover:opacity-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                {t('login.google')}
              </div>
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 opacity-0 transition-all duration-300 translate-y-12 group-hover:translate-y-0 group-hover:opacity-100 rounded-full">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                {t('login.google')}
              </div>
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-8 font-medium">
            {t('login.noAccount')} <Link className="text-gray-900 font-bold hover:underline" to="/register">{t('login.signUp')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
