import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Healith",
  description: "Privacy policy for Healith wellness companion",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2F3E33]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#5A6B5D] hover:text-[#2F3E33] transition-colors mb-8"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Healith
        </Link>

        <h1 className="text-4xl font-semibold font-[family-name:var(--font-playfair)] mb-8">
          Privacy Policy
        </h1>
        
        <p className="text-[#5A6B5D] mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="prose prose-lg max-w-none space-y-8 text-[#2F3E33]">
          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              Introduction
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              Healith ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI wellness companion service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              Information We Collect
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#5A6B5D]">
              <li><strong>Account Information:</strong> When you sign up, we collect your email address and profile information provided through your authentication provider.</li>
              <li><strong>Conversation Data:</strong> We store your conversations with Healith to provide continuity and personalized support across sessions.</li>
              <li><strong>Usage Data:</strong> We collect information about how you interact with our service, including session frequency and duration.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#5A6B5D]">
              <li>To provide and improve our wellness companion service</li>
              <li>To maintain conversation history and provide personalized support</li>
              <li>To identify patterns and provide relevant insights</li>
              <li>To ensure the safety and security of our users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              Data Security
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. Your conversation data is encrypted in transit and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              Your Rights
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              You have the right to access, correct, or delete your personal data. You may also request an export of your conversation history. To exercise these rights, please contact us at hello@healith.app.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              Third-Party Services
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              We use third-party services for authentication (Clerk) and AI processing (Google). These services have their own privacy policies and may process your data according to their terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              Contact Us
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:hello@healith.app" className="text-[#4A7C59] hover:underline">
                hello@healith.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
