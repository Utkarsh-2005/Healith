import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Healith",
  description: "Terms of service for Healith wellness companion",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        
        <p className="text-[#5A6B5D] mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        {/* Important Medical Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-10">
          <h2 className="text-xl font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Important Medical Disclaimer
          </h2>
          <div className="text-amber-900 space-y-3">
            <p>
              <strong>Healith is NOT a medical service, therapy, or substitute for professional mental health care.</strong>
            </p>
            <p>
              Healith is an AI-powered wellness companion designed for self-reflection and personal growth. It cannot:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Diagnose mental health conditions</li>
              <li>Provide medical or psychological treatment</li>
              <li>Replace licensed therapists, counselors, or doctors</li>
              <li>Respond to medical emergencies</li>
            </ul>
            <p className="font-medium mt-4">
              If you are experiencing a mental health crisis, please contact emergency services or a crisis helpline immediately.
            </p>
          </div>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-[#2F3E33]">
          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              By accessing or using Healith, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              2. Nature of the Service
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              Healith is an AI wellness companion that provides a space for self-reflection, emotional exploration, and personal growth. The service uses artificial intelligence to engage in supportive conversations and help you identify patterns in your thoughts and behaviors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              3. Eligibility
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              You must be at least 18 years old to use Healith. By using this service, you represent that you are at least 18 years of age and have the legal capacity to enter into these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              4. User Responsibilities
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#5A6B5D]">
              <li>Use the service for personal wellness and self-reflection purposes only</li>
              <li>Do not rely on Healith for medical advice or crisis intervention</li>
              <li>Seek professional help if you are experiencing a mental health crisis</li>
              <li>Keep your account credentials secure</li>
              <li>Do not use the service for any illegal or harmful purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              5. Limitation of Liability
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              Healith is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service. You use Healith at your own risk and agree that we are not responsible for any decisions you make based on conversations with the AI.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              6. Intellectual Property
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              All content, features, and functionality of Healith are owned by us and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              7. Termination
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              We reserve the right to terminate or suspend your access to Healith at any time, for any reason, without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              8. Changes to Terms
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              We may update these terms from time to time. Continued use of Healith after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] mb-4">
              9. Contact
            </h2>
            <p className="text-[#5A6B5D] leading-relaxed">
              For questions about these Terms, please contact us at{" "}
              <a href="mailto:utkarshjha.4009@gmail.com" className="text-[#4A7C59] hover:underline">
                utkarshjha.4009@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
