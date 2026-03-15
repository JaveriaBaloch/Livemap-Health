"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

interface Props {
  onClose: () => void;
}

const SPECIALIZATIONS = [
  "General Practitioner", "Cardiologist", "Neurologist", "Orthopedist", "Pediatrician",
  "Dermatologist", "Psychiatrist", "Surgeon", "Emergency Medicine", "Anesthesiologist",
  "Radiologist", "Oncologist", "Urologist", "ENT Specialist", "Ophthalmologist", "Paramedic", "Nurse",
];

export default function AuthModal({ onClose }: Props) {
  const { setUser } = useAppStore();
  const [currentView, setCurrentView] = useState<"auth" | "verify" | "reset" | "resetOtp">("auth");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", role: "user" as string,
    bloodGroup: "", allergies: "", specialization: "", licenseNumber: "",
    experience: "", hospital: "", emergencyContactName: "", emergencyContactPhone: "",
    emergencyContactRelation: "", otp: "", newPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const handleAuth = async () => {
    setLoading(true); setError("");
    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body: any = isLogin
        ? { email: form.email, password: form.password }
        : { ...form, allergies: form.allergies ? form.allergies.split(",").map((a) => a.trim()) : [], experience: form.experience ? parseInt(form.experience) : 0, emergencyContacts: form.emergencyContactName ? [{ name: form.emergencyContactName, phone: form.emergencyContactPhone, relation: form.emergencyContactRelation }] : [] };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { if (data.requiresVerification) { setPendingEmail(data.email || form.email); setCurrentView("verify"); setSuccess("Please check your email for verification code"); return; } throw new Error(data.error); }
      if (data.requiresVerification) { setPendingEmail(form.email); setCurrentView("verify"); setSuccess(data.message); }
      else { localStorage.setItem("user", JSON.stringify(data.user)); if (data.token) localStorage.setItem("token", data.token); setUser(data.user); onClose(); }
    } catch (err: any) { setError(err.message || "Something went wrong"); } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail, code: form.otp }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setSuccess("Email verified! You can now sign in."); setCurrentView("auth"); setIsLogin(true);
    } catch (err: any) { setError(err.message || "Verification failed"); } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/resend-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setSuccess("New code sent to your email!");
    } catch (err: any) { setError(err.message || "Failed to resend"); } finally { setLoading(false); }
  };

  const handleResetRequest = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setPendingEmail(form.email); setCurrentView("resetOtp"); setSuccess(data.message);
    } catch (err: any) { setError(err.message || "Failed to send reset code"); } finally { setLoading(false); }
  };

  const handlePasswordReset = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail, code: form.otp, newPassword: form.newPassword }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setSuccess("Password reset! You can now sign in."); setCurrentView("auth"); setIsLogin(true); setForm({ ...form, otp: "", newPassword: "" });
    } catch (err: any) { setError(err.message || "Reset failed"); } finally { setLoading(false); }
  };

  const isDoctor = form.role === "doctor";

  // Shared input style
  const inputCls = "w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 transition-all";
  const inputWithIconCls = "w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 transition-all";
  const selectCls = "w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 transition-all";
  const primaryBtnCls = "w-full py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl font-[Outfit] font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#3b82f6]/15";

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
  );

  // Icon components
  const MailIcon = () => <svg className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  const LockIcon = () => <svg className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
  const UserIcon = () => <svg className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const PhoneIcon = () => <svg className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl animate-slide-up max-h-[85dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="font-[Outfit] font-bold text-lg text-[#1e293b]">
            {currentView === "verify" ? "Verify Email" :
             currentView === "reset" ? "Reset Password" :
             currentView === "resetOtp" ? "Enter Reset Code" :
             isLogin ? "Sign In" : "Create Account"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f5f9] rounded-xl transition-colors">
            <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3 text-sm text-[#ef4444]">{error}</div>
          )}
          {success && (
            <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl px-4 py-3 text-sm text-[#10b981]">{success}</div>
          )}

          {/* ===== VERIFY VIEW ===== */}
          {currentView === "verify" && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-[#3b82f6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-[#475569] mb-1">We sent a verification code to:</p>
                <p className="font-mono text-[#3b82f6] font-medium">{pendingEmail}</p>
              </div>
              <div>
                <label className="text-xs text-[#475569] mb-1.5 block font-medium">Enter 6-digit code</label>
                <input name="otp" value={form.otp} onChange={handleChange} placeholder="000000" maxLength={6} className={`${inputCls} font-mono text-center text-xl tracking-[0.5em]`} />
              </div>
              <button onClick={handleVerifyOTP} disabled={loading || form.otp.length !== 6} className={primaryBtnCls}>
                {loading ? <><Spinner /> Verifying…</> : "Verify Email"}
              </button>
              <button onClick={handleResendOTP} disabled={loading} className="w-full text-sm text-[#94a3b8] hover:text-[#3b82f6] transition-colors">
                Didn't receive code? Resend
              </button>
              <button onClick={() => setCurrentView("auth")} className="w-full text-sm text-[#94a3b8] hover:underline">
                Back to Sign In
              </button>
            </div>
          )}

          {/* ===== RESET REQUEST VIEW ===== */}
          {currentView === "reset" && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-[#f59e0b]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <p className="text-[#475569]">Enter your email to receive a password reset code</p>
              </div>
              <div><label className="text-xs text-[#475569] mb-1.5 block font-medium">Email Address</label><div className="relative"><MailIcon /><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputWithIconCls} /></div></div>
              <button onClick={handleResetRequest} disabled={loading || !form.email} className={primaryBtnCls}>
                {loading ? <><Spinner /> Sending…</> : "Send Reset Code"}
              </button>
              <button onClick={() => setCurrentView("auth")} className="w-full text-sm text-[#94a3b8] hover:underline">Back to Sign In</button>
            </div>
          )}

          {/* ===== RESET OTP VIEW ===== */}
          {currentView === "resetOtp" && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-[#f59e0b]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <p className="text-[#475569] mb-1">Enter the reset code and new password</p>
                <p className="font-mono text-[#3b82f6] font-medium text-sm">{pendingEmail}</p>
              </div>
              <div><label className="text-xs text-[#475569] mb-1.5 block font-medium">Reset Code</label><input name="otp" value={form.otp} onChange={handleChange} placeholder="000000" maxLength={6} className={`${inputCls} font-mono text-center text-xl tracking-[0.5em]`} /></div>
              <div><label className="text-xs text-[#475569] mb-1.5 block font-medium">New Password</label><div className="relative"><LockIcon /><input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} placeholder="New password (min 6 chars)" className={inputWithIconCls} /></div></div>
              <button onClick={handlePasswordReset} disabled={loading || form.otp.length !== 6 || form.newPassword.length < 6} className={primaryBtnCls}>
                {loading ? <><Spinner /> Resetting…</> : "Reset Password"}
              </button>
              <button onClick={() => setCurrentView("auth")} className="w-full text-sm text-[#94a3b8] hover:underline">Back to Sign In</button>
            </div>
          )}

          {/* ===== MAIN AUTH VIEW ===== */}
          {currentView === "auth" && (
            <>
              {/* Role selector pills (only on register) */}
              {!isLogin && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#475569] mb-2 block font-medium">I am a…</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { v: "user", l: "Patient", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { v: "doctor", l: "Doctor", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                        { v: "paramedic", l: "Paramedic", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                        { v: "nurse", l: "Nurse", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
                      ].map(({ v, l, icon }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => { setForm({ ...form, role: v }); setError(""); }}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                            form.role === v
                              ? "border-[#3b82f6] bg-[#3b82f6]/5 text-[#3b82f6]"
                              : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1]"
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} /></svg>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#475569] mb-1.5 block font-medium">Full Name</label>
                    <div className="relative"><UserIcon /><input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className={inputWithIconCls} /></div>
                  </div>
                  <div>
                    <label className="text-xs text-[#475569] mb-1.5 block font-medium">Phone</label>
                    <div className="relative"><PhoneIcon /><input name="phone" value={form.phone} onChange={handleChange} placeholder="+49 176…" className={inputWithIconCls} /></div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs text-[#475569] mb-1.5 block font-medium">Email</label>
                <div className="relative"><MailIcon /><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputWithIconCls} /></div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-[#475569] mb-1.5 block font-medium">Password</label>
                <div className="relative"><LockIcon /><input name="password" type="password" value={form.password} onChange={handleChange} placeholder={isLogin ? "Your password" : "Create a password (min 6 chars)"} className={inputWithIconCls} /></div>
                {isLogin && (
                  <button onClick={() => setCurrentView("reset")} className="text-xs text-[#3b82f6] hover:underline mt-1.5">Forgot password?</button>
                )}
              </div>

              {/* Register-only fields */}
              {!isLogin && (
                <>
                  {/* Health info */}
                  <div className="pt-2">
                    <p className="text-xs text-[#94a3b8] font-medium mb-3 uppercase tracking-wider">Health Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#475569] mb-1.5 block font-medium">Blood Group</label>
                        <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className={selectCls}>
                          <option value="">Select</option>
                          {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[#475569] mb-1.5 block font-medium">Allergies</label>
                        <input name="allergies" value={form.allergies} onChange={handleChange} placeholder="Comma separated" className={inputCls} />
                      </div>
                    </div>
                  </div>

                  {/* Emergency contact */}
                  <div>
                    <p className="text-xs text-[#94a3b8] font-medium mb-3 uppercase tracking-wider">Emergency Contact</p>
                    <div className="grid grid-cols-3 gap-2">
                      <input name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Name" className={`${inputCls} text-xs`} />
                      <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} placeholder="Phone" className={`${inputCls} text-xs`} />
                      <input name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={handleChange} placeholder="Relation" className={`${inputCls} text-xs`} />
                    </div>
                  </div>

                  {/* Doctor fields */}
                  {isDoctor && (
                    <div className="pt-2 border-t border-[#e2e8f0]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <span className="text-xs text-[#10b981] font-semibold uppercase tracking-wider">Doctor Details</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-[#475569] mb-1.5 block font-medium">Specialization</label>
                          <select name="specialization" value={form.specialization} onChange={handleChange} className={selectCls}>
                            <option value="">Select Specialization</option>
                            {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs text-[#475569] mb-1.5 block font-medium">License #</label><input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="License number" className={inputCls} /></div>
                          <div><label className="text-xs text-[#475569] mb-1.5 block font-medium">Experience</label><input name="experience" value={form.experience} onChange={handleChange} placeholder="Years" type="number" className={inputCls} /></div>
                        </div>
                        <div><label className="text-xs text-[#475569] mb-1.5 block font-medium">Hospital / Clinic</label><input name="hospital" value={form.hospital} onChange={handleChange} placeholder="Where you practice" className={inputCls} /></div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submit */}
              <button onClick={handleAuth} disabled={loading} className={primaryBtnCls}>
                {loading ? <><Spinner /> Please wait…</> : isLogin ? "Sign In" : "Create Account"}
              </button>

              {/* Toggle login/register */}
              <p className="text-center text-sm text-[#475569]">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} className="text-[#3b82f6] hover:underline font-medium">
                  {isLogin ? "Register" : "Sign In"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}