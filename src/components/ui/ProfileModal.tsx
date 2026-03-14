"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { X, Save, User, Heart, Phone, Shield, MapPin, Loader2 } from "lucide-react";

interface Props { onClose: () => void; }

export default function ProfileModal({ onClose }: Props) {
  const { user, setUser } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bloodGroup: user?.bloodGroup || "",
    allergies: user?.allergies?.join(", ") || "",
  });

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          name: form.name,
          phone: form.phone,
          bloodGroup: form.bloodGroup,
          allergies: form.allergies.split(",").map(a => a.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("livemap_user", JSON.stringify(data.user));
        setEditing(false);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="absolute inset-0 z-40 bg-dark-900/95 backdrop-blur-lg animate-fade-in flex flex-col">
      <div className="px-4 pt-4 pb-3 safe-area-top flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Profile</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={22} className="text-slate-400" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Avatar & Name */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-medical-500 to-medical-700 flex items-center justify-center mb-3">
            <User size={36} className="text-white" />
          </div>
          <h3 className="font-display font-bold text-xl text-white">{user.name}</h3>
          <p className="text-sm text-slate-400 capitalize">{user.role}</p>
          {user.role === "doctor" && <p className="text-xs text-medical-400 mt-1">{(user as any).specialization}</p>}
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <div className="bg-dark-800 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 uppercase tracking-wide font-semibold">
              <User size={14} /> Personal Information
            </div>
            {editing ? (
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Name" className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-medical-500/50" />
                <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Phone" className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-medical-500/50" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm"><span className="text-slate-500">Email:</span> <span className="text-white">{user.email}</span></p>
                <p className="text-sm"><span className="text-slate-500">Phone:</span> <span className="text-white">{user.phone}</span></p>
              </div>
            )}
          </div>

          <div className="bg-dark-800 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 uppercase tracking-wide font-semibold">
              <Heart size={14} /> Health Information
            </div>
            {editing ? (
              <div className="space-y-3">
                <select value={form.bloodGroup} onChange={(e) => setForm({...form, bloodGroup: e.target.value})} className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-medical-500/50">
                  <option value="">Blood Group</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <input value={form.allergies} onChange={(e) => setForm({...form, allergies: e.target.value})} placeholder="Allergies (comma separated)" className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-medical-500/50" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm"><span className="text-slate-500">Blood Group:</span> <span className="text-white">{user.bloodGroup || "Not set"}</span></p>
                <p className="text-sm"><span className="text-slate-500">Allergies:</span> <span className="text-white">{user.allergies?.length ? user.allergies.join(", ") : "None"}</span></p>
              </div>
            )}
          </div>

          {user.emergencyContacts && user.emergencyContacts.length > 0 && (
            <div className="bg-dark-800 rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 uppercase tracking-wide font-semibold">
                <Phone size={14} /> Emergency Contacts
              </div>
              {user.emergencyContacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.relation}</p>
                  </div>
                  <a href={`tel:${c.phone}`} className="text-sm text-medical-400">{c.phone}</a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="flex-1 py-3 bg-dark-800 rounded-xl text-sm text-slate-400 border border-white/10">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-3 bg-medical-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="w-full py-3 bg-dark-800 rounded-xl text-sm text-medical-400 border border-medical-500/20 hover:border-medical-500/40 transition-colors">
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
