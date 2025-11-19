import React, { useState, useEffect, useCallback } from "react";

// --- Placeholder/Mock Components and Icons for Standalone Functionality ---

// Mock Link from react-router-dom
const Link = (props) => (
  <a
    href={props.to}
    className={props.className}
    onClick={(e) => {
      e.preventDefault();
      console.log(`Navigating to: ${props.to}`);
    }}
  >
    {props.children}
  </a>
);

// Icons using inline SVG (Lucide style)
const Key = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 15 6 6" />
    <path d="M7 17a4 4 0 0 1-4-4V7a4 4 4 0 1 1 8 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 1-2-2V3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2H7a2 2 0 0 0-2 2v4a4 4 0 0 0 4 4z" />
  </svg>
);
const Eye = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const Shield = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 13c0 5-6 9-8 9s-8-4-8-9V5l8-3 8 3z" />
  </svg>
);
const Code = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
const Cloud = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 19.25a4.5 4.5 0 0 1-4.5 4.5h-5A4.5 4.5 0 0 1 3.5 19.25a4.5 4.5 0 0 1 4.5-4.5h2.5V11a5.5 5.5 0 0 1 11 0v1.5" />
  </svg>
);
const Sun = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);
const Moon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const ChevronRight = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const Database = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12h18" />
    <path d="M3 19h18" />
  </svg>
);

export default function About() {
  const theme = localStorage.getItem("theme");

  const isDark = theme === "dark";

  const FeatureCard = ({ icon, title, description, delay }) => (
    <div
      className={
        "p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-2xl transition duration-500 hover:shadow-2xl hover:scale-[1.03] transform border-t-4 border-indigo-600 dark:border-amber-400 opacity-0 animate-fadeInUp cursor-pointer hover:border-l-4 hover:border-b-4 hover:border-r-4 border-b-indigo-400 border-r-indigo-400 dark:border-b-amber-300 dark:border-r-amber-300"
      }
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {React.createElement(icon, {
        className:
          "w-10 h-10 text-indigo-600 dark:text-amber-400 mb-4 transition-colors duration-500",
      })}
      <h3 className="text-xl font-extrabold mb-2 text-gray-900 dark:text-white tracking-wide">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
        {description}
      </p>
    </div>
  );

  // Tech Pill component for Infrastructure section
  const TechPill = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-4 p-4 rounded-xl bg-white dark:bg-gray-700 shadow-sm hover:bg-indigo-50 dark:hover:bg-gray-600 transition duration-300 border border-gray-100 dark:border-gray-600">
      <Icon className="w-6 h-6 flex-shrink-0 text-indigo-500 dark:text-amber-400 mt-1" />
      <div>
        <h4 className="text-base font-bold text-gray-900 dark:text-white">
          {title}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Main Header and Theme Toggle */}
        <header
          className="relative text-center mb-16 p-8 rounded-3xl overflow-hidden shadow-2xl 
                     bg-gradient-to-br from-indigo-700 to-blue-600 dark:from-gray-950 dark:to-gray-800 
                     opacity-0 animate-slideDown border-b-4 border-amber-400 dark:border-indigo-600"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          {/* Subtle Background Pattern */}
          <div
            className="absolute inset-0 opacity-10 dark:opacity-0 bg-repeat"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zm1 5v1H5z'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          ></div>

          {/* Theme Toggle Button - Now fully functional */}
        

          <h1 className="text-5xl md:text-8xl font-black text-white mb-4 leading-tight tracking-tight">
            SAFVAULT
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-indigo-200 dark:text-gray-300 max-w-4xl mx-auto mt-2">
            The Smart, Secure way to manage your data access.
          </h2>
        </header>

        {/* Visual Separator */}
        <div
          className="w-20 sm:w-1/4 h-1 mx-auto bg-amber-500 rounded-full mb-16 opacity-0 animate-fadeInUp"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        ></div>

        {/* Core Features Section (Security Focus) */}
        <section className="mb-20">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-center mb-12 dark:text-gray-900  border-b-2 border-amber-500 inline-block px-4 pb-2">
            Uncompromised Security & Control
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Key}
              title="Token-Gated Sharing"
              description="Issue secure, time-sensitive tokens for third-party access. Tokens are the only way in, ensuring a robust security layer."
              delay={600}
            />
            <FeatureCard
              icon={Eye}
              title="Strict Read-Only Guarantee"
              description="All token-based users are restricted to viewing and downloading. Modification or deletion privileges remain strictly with the owner."
              delay={700}
            />
            <FeatureCard
              icon={Shield}
              title="Real-Time Forcible Revocation"
              description="Instantly terminate any active token, blocking access immediately. Maintain 100% control over your data, 24/7, without delay."
              delay={800}
            />
          </div>
        </section>

        {/* Technology and Infrastructure Section - Adjusted for mobile responsiveness */}
        <section
          className="mb-16 p-6 sm:p-10 bg-indigo-50 dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-2xl border-2 border-indigo-100 dark:border-gray-700 opacity-0 animate-fadeInUp"
          style={{ animationDelay: "1000ms", animationFillMode: "forwards" }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center">
            <Code className="w-7 h-7 mr-3 text-amber-500" />
            Infrastructure: Modern & Reliable
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <TechPill
              title="Frontend (UI)"
              icon={Code}
              description="React with Tailwind for dynamic, professional styling."
            />
            <TechPill
              title="Backend (Logic)"
              icon={Database}
              description="Node.js/MongoDB for secure validation and data handling."
            />
            <TechPill
              title="Storage (Files)"
              icon={Cloud}
              description="Cloudinary for robust, globally distributed file hosting."
            />
            <TechPill
              title="Theming (UX)"
              icon={Sun}
              description="Persisted Dark/Light theme via LocalStorage and state management."
            />
          </div>
        </section>

        {/* Call to Action (Animated and Highly Prominent) */}
        <section
          className="text-center p-10 bg-indigo-600 dark:bg-amber-500 rounded-3xl text-white dark:text-gray-900 shadow-2xl opacity-0 animate-slideUp duration-700"
          style={{ animationDelay: "1300ms", animationFillMode: "forwards" }}
        >
          <h3 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
            Start Vaulting Your Data Today.
          </h3>
          <p className="text-base sm:text-lg mb-8 opacity-90 font-light">
            Experience data storage and sharing with total confidence and
            control.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 sm:px-12 py-3 sm:py-4 border-2 border-white dark:border-indigo-900 text-base sm:text-lg font-bold rounded-full text-indigo-900 bg-white dark:text-white dark:bg-indigo-700 hover:bg-gray-100 dark:hover:bg-indigo-600 transition duration-300 shadow-xl transform hover:scale-105 active:scale-95 uppercase tracking-wider"
          >
            Secure Your Account <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </section>
      </div>

      {/* Custom CSS for Animations and Font */}
      <style jsx>{`
        /* Font assumption: Inter is the preferred Google font */
        .font-inter {
          font-family: "Inter", sans-serif;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation-name: fadeInUp;
          animation-duration: 0.7s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .animate-slideDown {
          animation-name: slideDown;
          animation-duration: 0.8s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .animate-slideUp {
          animation-name: slideUp;
          animation-duration: 0.8s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
    </div>
  );
}
