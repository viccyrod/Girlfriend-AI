import BaseLayout from "@/components/BaseLayout";

export default function TermsPage() {
  return (
    <BaseLayout requireAuth={false}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-white">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Age Verification and Adult Content</h2>
            <p>
              By accessing or using Girlfriend.cx, you explicitly confirm and warrant that:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>You are at least 18 years old or the legal age of majority in your jurisdiction, whichever is higher</li>
              <li>You are legally permitted to access adult content in your jurisdiction</li>
              <li>You willingly consent to view adult-oriented content and conversations</li>
              <li>You understand that the platform may contain suggestive and mature themes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Girlfriend.cx, you agree to be bound by these Terms of Service. 
              If you do not agree to all terms, you must not access or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
            <p>
              Girlfriend.cx provides AI companion services for entertainment and social interaction purposes. 
              Our AI companions are artificial constructs and not real individuals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Impersonate or attempt to impersonate real individuals</li>
              <li>Create AI models based on real people without explicit consent</li>
              <li>Share or promote illegal content or activities</li>
              <li>Harass, abuse, or harm other users or AI companions</li>
              <li>Attempt to circumvent age verification systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Content Guidelines</h2>
            <p>
              While our platform allows mature themes, we strictly prohibit:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Illegal content or activities</li>
              <li>Content involving minors</li>
              <li>Non-consensual content</li>
              <li>Extreme violence or gore</li>
              <li>Hate speech or discrimination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account 
              and for restricting access to your device. You agree to accept responsibility 
              for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account immediately, 
              without prior notice or liability, for any reason, including breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users 
              of any material changes via email or through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Contact Information</h2>
            <p>
              For any questions about these Terms, please contact us at support@girlfriend.cx
            </p>
          </section>

          <div className="text-sm text-gray-400 mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
} 