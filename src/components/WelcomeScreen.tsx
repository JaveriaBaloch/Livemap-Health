"use client";

import { Shield, MapPin, Activity, Users, Heart } from "lucide-react";

interface Props {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* App Logo & Title */}
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            LiveMap Emergency
          </h1>
          <p className="text-gray-400 text-lg">
            Connect with medical professionals instantly
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-gray-300">
            <MapPin className="w-5 h-5 text-green-500" />
            <span>Find nearby specialists & pharmacies</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <Activity className="w-5 h-5 text-blue-500" />
            <span>Emergency SOS with real-time location</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <Users className="w-5 h-5 text-purple-500" />
            <span>Connect with verified healthcare providers</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Secure & private medical assistance</span>
          </div>
        </div>

        {/* Get Started Button */}
        <button
          onClick={onComplete}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
        >
          Get Started
        </button>

        <p className="text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
