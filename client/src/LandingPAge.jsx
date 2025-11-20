import React from "react";
import { 
  Lock, 
  Shield, 
  Zap, 
  Globe, 
  Key, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  UserCheck,
  Clock,
  Ban
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LandingPage = () => {
  const isDark = localStorage.getItem("theme") === "dark";

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-20">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-[#0A0F1F] via-[#0F1A3A] to-[#0A111F]' : 'bg-gradient-to-br from-blue-50 via-white to-orange-50'}`} />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          {isDark && (
            <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          )}
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium mb-6"
            >
              <Sparkles size={16} />
              Next-Gen Secure File Vault
            </motion.div>

            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Your Files.
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                Truly Private.
              </span>
            </h1>

            <p className={`mt-6 text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl`}>
              End-to-end encrypted. Zero-knowledge architecture. Revocable access tokens.
              <br className="hidden sm:block" />
              <span className="text-orange-500 font-semibold">You own your data. Always.</span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
              >
                Start Free Vault
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/login"
                className={`px-8 py-4 border-2 font-semibold text-lg rounded-2xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                  isDark 
                    ? 'border-gray-700 hover:border-orange-500 text-gray-200 hover:bg-orange-500/10' 
                    : 'border-gray-300 hover:border-orange-500 text-gray-700 hover:bg-orange-50'
                }`}
              >
                <Lock size={20} />
                See How It Works
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-8 hidden lg:flex">
              <div className="flex -space-x-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 border-4 border-white shadow-lg" />
                ))}
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>10,000+ users trust us</p>
                <p className="text-sm text-gray-500">With military-grade security</p>
              </div>
            </div>
          </motion.div>

          {/* Right - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className={`relative p-8 rounded-3xl ${isDark ? 'bg-gray-900/50' : 'bg-white'} backdrop-blur-xl border ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-2xl`}>
              {/* Floating Token Card */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 6 }}
                className={`absolute -top-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl ${isDark ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-orange-500 to-red-500'} text-white font-bold shadow-2xl whitespace-nowrap`}
              >
                SVAULT-9X7K-3M2P-REVOKABLE
              </motion.div>

              {/* Main Card */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <Lock className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Encrypted Vault</p>
                      <p className="text-sm text-gray-500">AES-256 + Zero Knowledge</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>

                <div className="space-y-3">
                  {["Confidential_Docs.pdf", "Financial_Report.xlsx", "Legal_Contract.docx"].map((file, i) => (
                    <motion.div
                      key={file}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <EyeOff className="w-5 h-5 text-orange-500" />
                      <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{file}</span>
                      <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Encrypted</span>
                    </motion.div>
                  ))}
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} border`}>
                  <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                    <Zap size={16} />
                    Real-time access control • Instant revoke • Audit logs
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
          <h2 className={`text-4xl sm:text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Security Isn't a Feature.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                It's Our Foundation.
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Key,
                title: "Zero Knowledge",
                desc: "We can't read your files. Period. Client-side encryption means only YOU hold the keys.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: UserCheck,
                title: "Revocable Tokens",
                desc: "Share files with expiry dates. Revoke access instantly — even after they download.",
                color: "from-orange-500 to-red-600"
              },
              {
                icon: Ban,
                title: "No Screenshots Allowed",
                desc: "Advanced protection blocks screenshots, screen recording, and print on all devices.",
                color: "from-emerald-500 to-teal-600"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-3xl ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} border backdrop-blur-sm shadow-xl`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} p-4 mb-6`}>
                  <item.icon className="w-full h-full text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-t from-orange-600/10 to-transparent">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Ready to Take Back Control?
          </h2>
          <p className={`text-xl mb-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Join thousands who stopped sharing files and started <span className="text-orange-500 font-bold">vaulting</span> them.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/signup"
              className="px-12 py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-4"
            >
              Create Your Secure Vault
              <Shield className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="text-green-500" />
              No credit card required • Free forever plan
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default LandingPage;