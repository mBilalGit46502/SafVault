import React, { useState, useEffect } from "react";
import { Github, Linkedin, Twitter, Sun, Moon } from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function Footer() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  const isDark = currentTheme === "dark";
  const currentYear = new Date().getFullYear();

  const navigate = useNavigate();

  const handleThemeToggle = () => {
    const newTheme = isDark ? "light" : "dark";

    setCurrentTheme(newTheme);

    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
      // Apply theme class to the document root
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize theme on mount
      document.documentElement.classList.toggle("dark", isDark);

      const handleStorageChange = () => {
        const storedTheme = localStorage.getItem("theme") || "light";
        if (currentTheme !== storedTheme) {
          setCurrentTheme(storedTheme);
        }
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [currentTheme, isDark]);

  const allLinks = [
    { name: "Privacy", href: "/privacy" },
    { name: "About", href: "/about" },
  ];

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "https://github.com/mBilalGit46502" },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://www.linkedin.com/in/muhammad-bilal-468936312",
    },
  ];

  const linkClasses = `text-xs hover:text-orange-500 transition-colors cursor-pointer ${
    isDark ? "text-gray-400" : "text-gray-600"
  }`;
  const textColorClass = isDark ? "text-gray-400" : "text-gray-600";
  const borderColorClass = isDark ? "border-gray-700" : "border-gray-200";

  // Use this class for the navigation links container to make them visible on mobile
  // Changed from "hidden sm:flex" to "flex"
  const navLinkContainerClasses = "flex space-x-4";

  return (
    <footer
      className={`w-full py-6 border-t transition-colors duration-300 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content Row - Stacks vertically on mobile (flex-col) */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs space-y-4 md:space-y-0">
          {/* Left Section: Logo and Navigation Links */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <h3
              className={`font-extrabold text-lg text-orange-500 tracking-wider`}
            >
              SafVault
            </h3>

            {/* Navigation Links - NOW VISIBLE ON ALL SCREENS */}
            <div className={navLinkContainerClasses}>
              {allLinks.map((link) => (
                <div
                  key={link.name}
                  onClick={() => navigate(link.href)}
                  className={linkClasses}
                >
                  {link.name}
                </div>
              ))}
            </div>
          </div>

          {/* Right Section: Social Links and Theme Toggle */}
          <div className="flex items-center space-x-6">
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  className="hover:text-orange-500 transition-colors"
                >
                  <social.icon size={18} className={textColorClass} />
                </a>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              className={`p-2 rounded-full transition-colors duration-300 ml-4 shadow-md ${
                isDark
                  ? "bg-gray-700 text-white hover:bg-orange-500 hover:text-gray-900"
                  : "bg-gray-100 text-gray-800 hover:bg-orange-500 hover:text-white"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Unified Copyright Line - Placed at the bottom center */}
        <div
          className={`mt-6 pt-4 border-t flex justify-center ${borderColorClass}`}
        >
          <p className={`text-xs ${textColorClass} text-center`}>
            &copy; {currentYear} SafVault. All rights reserved.
            <span className="ml-2 font-mono text-gray-500/50">v1.2.0</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
