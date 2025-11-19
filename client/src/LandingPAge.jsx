import React from "react";
import { LogIn, UserPlus, Shield, Globe, Lock, Code, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LandingPage = () => {
  const theme = localStorage.getItem("theme");
  const isDark = theme === "dark";

  const styles = {
    fontFamily: "font-sans",

    bgColor: isDark ? "bg-[#0A111F]" : "bg-white",
    mainTextColor: isDark ? "text-white" : "text-gray-900",
    mutedTextColor: isDark ? "text-gray-400" : "text-gray-600",

    securityColor: isDark ? "text-[#4dffe8]" : "text-blue-600",
    actionColor: "text-orange-500",

    cardBg: isDark ? "bg-[#172540]" : "bg-gray-50",
    cardBorder: isDark ? "border-gray-800" : "border-gray-200",
    cardHover:
      "hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300",

    loginButtonClass: `inline-flex items-center justify-center gap-3 px-8 py-3 text-lg font-medium rounded-lg border-2 transition-all duration-300 ${
      isDark
        ? "text-white border-gray-600 hover:border-orange-500 hover:bg-white/5"
        : "text-gray-700 border-gray-400 hover:border-orange-500 hover:bg-gray-100"
    }`,

    h1GradientClass: `bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-red-500`,

    tokenVisualBg: isDark ? "bg-black/20" : "bg-gray-100",

    ctaButton: `inline-flex items-center justify-center gap-3 px-8 py-3 text-lg font-extrabold rounded-lg text-black shadow-xl shadow-orange-500/30`,
  };

  const uniqueFeatures = [
    {
      icon: Lock,
      title: "Zero-Trust Encryption",
      description:
        "Files secured with client-side AES-256 encryption. Only you hold the keys.",
      badge: "AES-256",
    },
    {
      icon: Globe,
      title: "Tokenized Global Sharing",
      description:
        "Temporary, revocable access tokens enable secure, borderless file sharing.",
      badge: "Smart Access",
    },
    {
      icon: Shield,
      title: "Data Resilience & Uptime",
      description:
        "Distributed infrastructure guarantees maximum redundancy and near-perfect uptime.",
      badge: "99.99%",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div
      className={`min-h-screen flex flex-col items-center justify-start transition-colors duration-500 ${styles.fontFamily} relative`}
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
           {" "}
      <div className={`absolute inset-0 ${styles.bgColor} z-0`}>
               {" "}
        {isDark && (
          <div className="absolute inset-0 bg-radial-gradient from-[#0A111F] via-[#0A111F] to-[#172540] opacity-90" />
        )}
               {" "}
        {!isDark && (
          <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100" />
        )}
             {" "}
      </div>
           {" "}
      <div className="max-w-7xl w-full px-4 sm:px-8 lg:px-12 pt-12 pb-16 z-10">
                     {" "}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center pt-8 pb-12 sm:pb-20">
                   {" "}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={`text-center md:text-left`}
          >
                       {" "}
            <motion.p
              variants={itemVariants}
              className={`text-sm font-semibold ${styles.securityColor} uppercase tracking-widest mb-3 flex items-center justify-center md:justify-start gap-2`}
            >
                            <Zap size={16} /> Secure File Vaulting Redefined    
                     {" "}
            </motion.p>
                       {" "}
            <motion.h1
              variants={itemVariants}
              className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-5 ${styles.mainTextColor} leading-tight`}
            >
                            Files Safe. Access              {" "}
              <span className={styles.h1GradientClass}>Global.</span>           {" "}
            </motion.h1>
                        {/* Sub-Headline */}           {" "}
            <motion.p
              variants={itemVariants}
              className={`text-lg sm:text-xl mb-8 font-normal max-w-xl ${styles.mutedTextColor} leading-relaxed`}
            >
                            SafVault utilizes **zero-trust encryption** and
              unique **revocable               access tokens** to secure your
              digital world.            {" "}
            </motion.p>
                       {" "}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
            >
                           {" "}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                               {" "}
                <Link
                  to="/signup"
                  className={`${styles.ctaButton}`}
                  style={{ backgroundColor: "#FFD700" }} // Gold for high action
                >
                                   {" "}
                  <UserPlus size={22} className="text-black" />                 {" "}
                  <span className="text-black">Start Your Vault Free</span>     
                           {" "}
                </Link>
                             {" "}
              </motion.div>
                           {" "}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                               {" "}
                <Link to="/login" className={styles.loginButtonClass}>
                                   {" "}
                  <LogIn size={22} className={styles.securityColor} /> Log In  
                               {" "}
                </Link>
                             {" "}
              </motion.div>
                         {" "}
            </motion.div>
                       {" "}
            <motion.p
              variants={itemVariants}
              className={`mt-5 text-sm ${styles.securityColor} font-medium flex items-center justify-center md:justify-start gap-2`}
            >
                            <Lock size={15} /> 100% Client-Side Encryption
              Guarantee.            {" "}
            </motion.p>
                     {" "}
          </motion.div>
                   {" "}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className={`relative p-6 sm:p-8 rounded-xl shadow-2xl shadow-black/50 transition-colors duration-500 ${styles.cardBg} border ${styles.cardBorder}`}
          >
                       {" "}
            <div className="absolute top-4 right-4 p-1.5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center gap-1">
                            <Globe size={14} /> Global Access            {" "}
            </div>
                       {" "}
            <h3
              className={`text-xl font-semibold mb-5 ${styles.mainTextColor}`}
            >
                            Secure Token Distribution            {" "}
            </h3>
                       {" "}
            <div
              className={`flex rounded-lg p-3 mb-4 items-center border border-dashed border-orange-500/50 ${styles.tokenVisualBg}`}
            >
                           {" "}
              <Code
                size={20}
                className={`${styles.actionColor} mr-3 flex-shrink-0 animate-pulse`}
              />
                           {" "}
              <input
                type="text"
                readOnly
                value="SVAULT-J3K9-W7PL-D8E5-TKN"
                className={`flex-grow bg-transparent text-base font-mono focus:outline-none ${styles.mainTextColor} select-all`}
              />
                           {" "}
              <button className="bg-orange-500 text-white text-sm px-3 py-1.5 rounded-md hover:bg-orange-600 transition">
                                Copy              {" "}
              </button>
                         {" "}
            </div>
                       {" "}
            <div
              className={`p-4 rounded-lg border ${styles.cardBorder} text-sm ${styles.mainTextColor} ${styles.tokenVisualBg}`}
            >
                           {" "}
              <p className="font-semibold mb-2 flex items-center gap-2">
                               {" "}
                <Lock size={16} className={styles.securityColor} /> Encrypted  
                              Files:              {" "}
              </p>
                           {" "}
              <ul className={`space-y-1 ${styles.mutedTextColor} ml-4`}>
                               {" "}
                <li className="list-disc">Marketing_Strategy.pdf</li>           
                    <li className="list-disc">Encrypted_Project_Notes.txt</li> 
                           {" "}
              </ul>
                         {" "}
            </div>
                       {" "}
            <p
              className={`mt-4 text-xs italic ${styles.actionColor} text-right font-medium`}
            >
                            Access is time-bound and revocable instantly.      
                   {" "}
            </p>
                     {" "}
          </motion.div>
                 {" "}
        </div>
               {" "}
        <div
          className={`grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16 pt-8 border-t ${styles.cardBorder}`}
        >
                   {" "}
          {uniqueFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              initial="hidden"
              animate="show"
              whileHover={{
                scale: 1.05,
                boxShadow: isDark
                  ? "0 0 30px rgba(77, 255, 232, 0.2)"
                  : "0 0 30px rgba(59, 130, 246, 0.2)",
              }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-xl text-left ${styles.cardBg} shadow-md border ${styles.cardBorder} border-l-4 border-orange-500 cursor-pointer`}
              transition={{ delay: 0.2 * index + 0.8 }}
            >
                           {" "}
              <div className="flex justify-between items-start mb-3">
                               {" "}
                <feature.icon
                  size={30}
                  className={`${styles.securityColor} mr-3`}
                />
                               {" "}
                <span
                  className={`text-xs font-semibold uppercase py-1 px-3 rounded-full ${
                    isDark
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                                    {feature.badge}               {" "}
                </span>
                             {" "}
              </div>
                           {" "}
              <h3 className={`text-xl font-bold mb-2 ${styles.mainTextColor}`}>
                                {feature.title}             {" "}
              </h3>
                           {" "}
              <p
                className={`text-base ${styles.mutedTextColor} leading-relaxed`}
              >
                                {feature.description}             {" "}
              </p>
                         {" "}
            </motion.div>
          ))}
                 {" "}
        </div>
               {" "}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }} // Delayed entry
          className={`mt-20 p-8 sm:p-10 rounded-xl text-center shadow-2xl ${
            isDark
              ? "bg-orange-600/10 border border-orange-600/30"
              : "bg-gray-100 border border-gray-300"
          }`}
        >
                   {" "}
          <h2
            className={`text-2xl sm:text-3xl font-bold mb-3 ${styles.mainTextColor}`}
          >
                        Stop Sharing. Start Vaulting.          {" "}
          </h2>
                   {" "}
          <p className={`text-lg mb-6 ${styles.mutedTextColor}`}>
                        Secure your files with a system trusted globally for
            confidentiality             and access control.          {" "}
          </p>
                   {" "}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                       {" "}
            <Link
              to="/signup"
              className={`${styles.ctaButton} px-10 py-3.5 text-xl`}
              style={{ backgroundColor: "#FFD700" }}
            >
                           {" "}
              <span className="text-black">Get Started Securely Today</span>   
                     {" "}
            </Link>
                     {" "}
          </motion.div>
                 {" "}
        </motion.div>
             {" "}
      </div>
         {" "}
    </motion.div>
  );
};

export default LandingPage;
