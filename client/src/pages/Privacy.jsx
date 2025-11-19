import React, { useState, useEffect, useCallback } from "react";

// --- Mock Icons (Lucide Style) ---
const ShieldCheck = (props) => (
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
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const Zap = (props) => (
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
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const User = (props) => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const Mail = (props) => (
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
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const AlertTriangle = (props) => (
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
    <path d="M10.29 3.12 1.83 17.52a2 2 0 0 0 1.77 2.89h16.8a2 2 0 0 0 1.77-2.89L13.71 3.12a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
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

// --- Theme Management Logic ---
const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("theme") || "light";
  }
  return "light";
};

// --- Custom Component for Policy Sections ---
const PolicySection = ({ icon: Icon, title, children }) => (
  <div className="mb-10 p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-l-4 border-indigo-500 dark:border-amber-400 transition-colors duration-500">
    <h2 className="flex items-center text-2xl sm:text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">
      <Icon className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-indigo-500 dark:text-amber-400 flex-shrink-0" />
      {title}
    </h2>
    <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
      {children}
    </div>
  </div>
);

// --- Main Privacy Policy Content Component ---
export default function Privacy() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  /**
   * Toggles the theme state between 'light' and 'dark'.
   */
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  /**
   * Manages theme class on the document element and listens for storage changes.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);

    const handleStorageChange = () => {
      const storedTheme = localStorage.getItem("theme") || "light";
      if (theme !== storedTheme) {
        setTheme(storedTheme);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isDark, theme]);

  return (
    <div >
      {/* Header and Title */}
      <header className="max-w-4xl mx-auto mb-10 text-center relative">
        <h1 className="text-4xl sm:text-5xl font-black dark:text-gray-900 dark:text-white mb-2 tracking-tight">
          SafVault Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Last Updated: November 18, {new Date().getFullYear()}
        </p>

  
      </header>

      {/* Policy Content Container */}
      <main className="max-w-4xl mx-auto">
        <div className="p-4 sm:p-6 lg:p-10 dark:bg-gray-100 dark:bg-gray-900 rounded-3xl shadow-2xl transition-colors duration-500 border border-gray-200 dark:border-gray-700">
          <p className="text-lg mb-10 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-medium border-l-4 border-indigo-600">
            At SafVault, we believe in **minimalism and control**. We only
            collect the data necessary to provide our highly secure token-gated
            file sharing service. Your data privacy is our paramount security
            measure.
          </p>

          <PolicySection icon={User} title="1. Information We Collect">
            <p>
              We adhere strictly to the principle of data minimization. The only
              data we collect is essential for account management and service
              operation.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                **Account Information:** Email address (for login and essential
                service communications) and a securely hashed password.
              </li>
              <li>
                **Usage & Metadata:** Timestamps, device information, and IP
                addresses are logged only for **security, compliance, and
                anti-abuse purposes** (e.g., tracking token usage and
                revocation).
              </li>
              <li>
                **Stored Content:** The files you upload are stored securely via
                our third-party provider (Cloudinary, as referenced in the About
                page). SafVault **does not access, inspect, or process** the
                content of your files.
              </li>
            </ul>
          </PolicySection>

          <PolicySection icon={Zap} title="2. How We Use Your Information">
            <p>
              We use the limited information we collect for the following
              purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                **Service Provision:** To operate, maintain, and provide the
                core functionality of SafVault, including user authentication
                and token generation/revocation.
              </li>
              <li>
                **Security & Fraud Prevention:** To monitor for and prevent
                malicious activity, unauthorized access, and misuse of the
                token-gated system.
              </li>
              <li>
                **Communication:** To send you essential technical notices,
                security alerts, and support and administrative messages.
              </li>
            </ul>
          </PolicySection>

          <PolicySection
            icon={ShieldCheck}
            title="3. Data Retention and Security"
          >
            <p>
              We retain your data only for as long as your account is active or
              as necessary to fulfill the purposes for which it was collected.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                **Retention:** Upon account deletion, all account information
                and metadata are permanently removed from our systems within 90
                days, subject to legal hold obligations.
              </li>
              <li>
                **Security:** We employ **industry-leading encryption** for all
                data both in transit (TLS/SSL) and at rest. Access to user data
                within our infrastructure is strictly controlled and audited.
              </li>
            </ul>
          </PolicySection>

          <PolicySection
            icon={AlertTriangle}
            title="4. Disclosure of Information"
          >
            <p>
              SafVault does not sell or rent your personal information to third
              parties for marketing purposes. We only share information under
              the following limited circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                **With Service Providers:** We use trusted third-party services
                (e.g., cloud storage, email delivery) to operate SafVault, and
                we only share the minimum necessary information required for
                them to perform their services.
              </li>
              <li>
                **For Legal Reasons:** If required by law, subpoena, or if we
                believe it is necessary to protect our rights, your safety, or
                the safety of others.
              </li>
            </ul>
          </PolicySection>

          <PolicySection icon={Mail} title="5. Contact Us">
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or your data, please reach out to our dedicated
              privacy team.
            </p>
            <div className="mt-4 p-4 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl font-mono">
              <p className="text-gray-900 dark:text-gray-100">
                Email:{" "}
                <a
                  href="mailto:privacy@safvault.com"
                  className="text-indigo-600 dark:text-amber-400 hover:underline"
                >
                  mb1268225@gmail.com
                </a>
              </p>
            
            </div>
            <p className="mt-4">
              We aim to respond to all inquiries within 10 business days.
            </p>
          </PolicySection>
        </div>
      </main>

      {/* Custom CSS for Font */}
      <style jsx>{`
        .font-inter {
          font-family: "Inter", sans-serif;
        }
      `}</style>
    </div>
  );
}


