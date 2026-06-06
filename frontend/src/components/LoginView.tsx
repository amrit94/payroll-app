import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mail, ShieldCheck, RefreshCw, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface LoginViewProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Automatically focus the OTP input field when switching to the OTP verification step
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/otp/request`, { email });
      setStep('otp');
      setSuccessMsg('OTP verification code has been dispatched to your email address.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to request OTP. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/otp/verify`, {
        email,
        otp
      });
      const token = res.data.access_token;
      onLoginSuccess(token);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090b10] bg-radial-gradient relative overflow-hidden px-4">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative z-10 space-y-6 backdrop-blur-xl animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-500/20 to-amber-500/20 rounded-2xl border border-slate-700/50 shadow-inner mb-2">
            <ShieldCheck className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Payroll & Paddy portal</h2>
          <p className="text-xs text-slate-400">
            Enterprise Manager Identity & Security Gateway
          </p>
        </div>

        {/* System Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 animate-shake">
            <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
            <span className="text-xs text-rose-300 leading-normal">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start space-x-2">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
            <span className="text-xs text-indigo-300 leading-normal">{successMsg}</span>
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                Manager Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold rounded-xl transition-all text-sm shadow-lg shadow-indigo-950/50 flex items-center justify-center space-x-2 min-h-[46px]"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Requesting Security Token...</span>
                </>
              ) : (
                <>
                  <span>Send OTP Verification</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="otp" className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                Enter 6-Digit Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="otp"
                  ref={otpInputRef}
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-amber-500 rounded-xl text-white placeholder-slate-600 text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-slate-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Change Email Address
              </button>
              
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center space-x-1"
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-[#090b10] font-extrabold rounded-xl transition-all text-sm shadow-lg shadow-amber-950/30 flex items-center justify-center space-x-2 min-h-[46px]"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#090b10]" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify and Authenticate</span>
                  <ShieldCheck className="h-4 w-4 text-[#090b10]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Developer Sandbox Banner */}
        {import.meta.env.VITE_SERVER_MODE === 'dev' && (
          <div className="pt-2 border-t border-slate-900 text-center">
            <p className="text-[10px] text-slate-500 leading-normal">
              💡 <strong>Sandbox Tip:</strong> If MSG91 is not configured, check the backend terminal server console to retrieve the generated OTP code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
