import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';

export const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: Info Form, 2: OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    otp: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send OTP to Gmail
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.sendRegistrationOtp({
        email: formData.email,
        name: formData.name,
      });

      setSuccessMessage(res.data.message || 'Verification code sent to your email!');
      if (res.data.simulatedOtp) {
        setFormData((prev) => ({ ...prev, otp: res.data.simulatedOtp }));
      }
      setStep(2);
      setCountdown(60); // 60-second cooldown
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (
        err.code === 'ERR_NETWORK' ||
        !err.response ||
        (typeof err.response?.data === 'string' && err.response.data.includes('ECONNREFUSED')) ||
        err.response?.status === 500 ||
        err.response?.status === 502 ||
        err.response?.status === 504
      ) {
        setError('Cannot connect to library backend server. Please verify the backend is running on port 5001.');
      } else {
        setError(
          'Failed to send verification code. Please check your email address and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;

    setError('');
    setSuccessMessage('');
    setResending(true);

    try {
      const res = await authAPI.resendRegistrationOtp({
        email: formData.email,
        name: formData.name,
      });

      setSuccessMessage(res.data.message || 'Fresh verification code dispatched to your email.');
      if (res.data.simulatedOtp) {
        setFormData((prev) => ({ ...prev, otp: res.data.simulatedOtp }));
      }
      setCountdown(60);
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (
        err.code === 'ERR_NETWORK' ||
        !err.response ||
        (typeof err.response?.data === 'string' && err.response.data.includes('ECONNREFUSED')) ||
        err.response?.status === 500 ||
        err.response?.status === 502 ||
        err.response?.status === 504
      ) {
        setError('Cannot connect to library backend server. Please verify the backend is running on port 5001.');
      } else {
        setError('Failed to resend verification code. Please try again shortly.');
      }
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = formData.otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        otp: cleanOtp,
        role: 'member',
      });

      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (
        err.code === 'ERR_NETWORK' ||
        !err.response ||
        (typeof err.response?.data === 'string' && err.response.data.includes('ECONNREFUSED')) ||
        err.response?.status === 500 ||
        err.response?.status === 502 ||
        err.response?.status === 504
      ) {
        setError('Cannot connect to library backend server. Please verify the backend is running on port 5001.');
      } else {
        setError('Verification failed. Invalid or expired code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-600/30">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          Join Librio Library
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {step === 1
            ? 'Create an account with Gmail OTP verification'
            : 'Enter the 6-digit verification code sent to your email'}
        </p>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 1
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            1. Account Details
          </span>
          <span className="text-slate-300">→</span>
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 2
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            2. Email OTP Verification
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-200">
          {/* Alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('already exists') && (
                  <div className="mt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-900 bg-teal-100/70 hover:bg-teal-200/70 px-2.5 py-1 rounded-lg text-xs transition-colors"
                    >
                      Sign In to Your Account Now →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Basic Information Form */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Anandha Kannan"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (Gmail) *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  A real 6-digit OTP verification code will be sent to this email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="Min 6 chars"
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send Verification Code (OTP)
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification Form */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleVerifyAndRegister}>
              <div className="bg-teal-50/80 border border-teal-100 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-600">Verification code sent to:</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5 break-all">
                  {formData.email}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="mt-2 text-xs text-teal-700 hover:text-teal-900 font-semibold underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Change email address
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit Verification Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.otp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        otp: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                      })
                    }
                    required
                    autoFocus
                    placeholder="• • • • • •"
                    className="w-full text-center py-3.5 text-2xl font-mono font-bold tracking-[0.5em] bg-slate-50 rounded-2xl border-2 border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-500/20 focus:outline-none transition-all placeholder:tracking-[0.3em] text-teal-900"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Valid for 5 minutes
                  </span>
                  <span>6 digits</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resending}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`}
                  />
                  {resending
                    ? 'Resending...'
                    : countdown > 0
                    ? `Resend Code in ${countdown}s`
                    : 'Resend Verification Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || formData.otp.trim().length !== 6}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify OTP & Complete Registration
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
