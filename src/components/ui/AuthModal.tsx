"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { X, Mail, Lock, User, Phone, Stethoscope, Loader2, MessageSquare } from "lucide-react";

interface Props {
  onClose: () => void;
}

const SPECIALIZATIONS = [
  "General Practitioner", "Cardiologist", "Neurologist", "Orthopedist", "Pediatrician",
  "Dermatologist", "Psychiatrist", "Surgeon", "Emergency Medicine", "Anesthesiologist",
  "Radiologist", "Oncologist", "Urologist", "ENT Specialist", "Ophthalmologist", "Paramedic", "Nurse"
];

export default function AuthModal({ onClose }: Props) {
  const { setUser } = useAppStore();
  const [currentView, setCurrentView] = useState<"auth" | "verify" | "reset" | "resetOtp">("auth");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", role: "user" as string,
    bloodGroup: "", allergies: "", specialization: "", licenseNumber: "",
    experience: "", hospital: "", emergencyContactName: "", emergencyContactPhone: "",
    emergencyContactRelation: "", otp: "", newPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body: any = isLogin
        ? { email: form.email, password: form.password }
        : {
            ...form,
            allergies: form.allergies ? form.allergies.split(",").map((a) => a.trim()) : [],
            experience: form.experience ? parseInt(form.experience) : 0,
            emergencyContacts: form.emergencyContactName
              ? [{ name: form.emergencyContactName, phone: form.emergencyContactPhone, relation: form.emergencyContactRelation }]
              : [],
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (data.requiresVerification) {
          setPendingEmail(data.email || form.email);
          setCurrentView("verify");
          setSuccess("Please check your email for verification code");
          return;
        }
        throw new Error(data.error);
      }

      if (data.requiresVerification) {
        setPendingEmail(form.email);
        setCurrentView("verify");
        setSuccess(data.message);
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) localStorage.setItem("token", data.token);
        setUser(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: form.otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Email verified successfully! You can now log in.");
      setCurrentView("auth");
      setIsLogin(true);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("New verification code sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPendingEmail(form.email);
      setCurrentView("resetOtp");
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || "Failed to send reset code to email");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: pendingEmail, 
          code: form.otp, 
          newPassword: form.newPassword 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Password reset successfully! You can now log in.");
      setCurrentView("auth");
      setIsLogin(true);
      setForm({ ...form, otp: "", newPassword: "" });
    } catch (err: any) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = form.role === "doctor";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-dark-800 rounded-2xl border border-white/10 shadow-2xl animate-slide-up max-h-[85dvh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-800 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-lg">
            {currentView === "verify" ? "Verify Email" :
             currentView === "reset" ? "Reset Password" :
             currentView === "resetOtp" ? "Enter Reset Code" :
             isLogin ? "Sign In" : "Create Account"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-emergency-500/10 border border-emergency-500/30 rounded-xl px-4 py-3 text-sm text-emergency-300">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-safe-500/10 border border-safe-500/30 rounded-xl px-4 py-3 text-sm text-safe-300">
              {success}
            </div>
          )}

          {/* Email Verification View */}
          {currentView === "verify" && (
            <div className="space-y-4">
              <div className="text-center">
                <Mail size={48} className="mx-auto mb-4 text-medical-400" />
                <p className="text-slate-300 mb-2">We sent a verification code to:</p>
                <p className="font-mono text-medical-400">{pendingEmail}</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Enter 6-digit code</label>
                <input
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  placeholder="123456"
                  className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50 font-mono text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || form.otp.length !== 6}
                className="w-full py-3.5 bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 rounded-xl font-display font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : "Verify Email"}
              </button>

              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-sm text-slate-400 hover:text-medical-400 transition-colors"
              >
                Didn't receive code? Resend to Email
              </button>

              <button
                onClick={() => setCurrentView("auth")}
                className="w-full text-sm text-slate-500 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Password Reset Request View */}
          {currentView === "reset" && (
            <div className="space-y-4">
              <div className="text-center">
                <Lock size={48} className="mx-auto mb-4 text-medical-400" />
                <p className="text-slate-300 mb-4">Enter your email address to receive a password reset code</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full bg-dark-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50"
                  />
                </div>
              </div>

              <button
                onClick={handleResetRequest}
                disabled={loading || !form.email}
                className="w-full py-3.5 bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 rounded-xl font-display font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : "Send Reset Code"}
              </button>

              <button
                onClick={() => setCurrentView("auth")}
                className="w-full text-sm text-slate-500 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Password Reset OTP View */}
          {currentView === "resetOtp" && (
            <div className="space-y-4">
              <div className="text-center">
                <Lock size={48} className="mx-auto mb-4 text-medical-400" />
                <p className="text-slate-300 mb-2">Enter the reset code sent to your email and your new password</p>
                <p className="font-mono text-medical-400">{pendingEmail}</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reset Code</label>
                <input
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  placeholder="123456"
                  className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50 font-mono text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="New password"
                    className="w-full bg-dark-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50"
                  />
                </div>
              </div>

              <button
                onClick={handlePasswordReset}
                disabled={loading || form.otp.length !== 6 || form.newPassword.length < 6}
                className="w-full py-3.5 bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 rounded-xl font-display font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Resetting...</> : "Reset Password"}
              </button>

              <button
                onClick={() => setCurrentView("auth")}
                className="w-full text-sm text-slate-500 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Main Auth View */}
          {currentView === "auth" && (
            <>
              {!isLogin && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="w-full bg-dark-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input name="phone" value={form.phone} onChange={handleChange} placeholder="+49 176..." className="w-full bg-dark-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">I am a...</label>
                    <select name="role" value={form.role} onChange={handleChange} className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-medical-500/50">
                      <option value="user">Individual / Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="paramedic">Paramedic</option>
                      <option value="nurse">Nurse</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full bg-dark-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full bg-dark-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                </div>
                {isLogin && (
                  <button
                    onClick={() => setCurrentView("reset")}
                    className="text-xs text-medical-400 hover:underline mt-1"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {!isLogin && (
                <>
                  {/* Health Info for all users */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Blood Group</label>
                      <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-medical-500/50">
                        <option value="">Select</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Allergies</label>
                      <input name="allergies" value={form.allergies} onChange={handleChange} placeholder="Comma separated" className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-3 gap-2">
                    <input name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Emergency contact" className="bg-dark-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                    <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} placeholder="Phone" className="bg-dark-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                    <input name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={handleChange} placeholder="Relation" className="bg-dark-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                  </div>

                  {/* Doctor fields */}
                  {isDoctor && (
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 text-sm text-safe-400"><Stethoscope size={16} /> Doctor Details</div>
                      <select name="specialization" value={form.specialization} onChange={handleChange} className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-medical-500/50">
                        <option value="">Select Specialization</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="License #" className="bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                        <input name="experience" value={form.experience} onChange={handleChange} placeholder="Years exp." type="number" className="bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                      </div>
                      <input name="hospital" value={form.hospital} onChange={handleChange} placeholder="Hospital / Clinic" className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-medical-500/50" />
                    </div>
                  )}
                </>
              )}

              <button onClick={handleAuth} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 rounded-xl font-display font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Please wait...</> : isLogin ? "Sign In" : "Create Account"}
              </button>

              <p className="text-center text-sm text-slate-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} className="text-medical-400 hover:underline">{isLogin ? "Register" : "Sign In"}</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
