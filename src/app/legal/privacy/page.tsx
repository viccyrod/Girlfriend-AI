import BaseLayout from "@/components/BaseLayout";

export default function PrivacyPage() {
  return (
    <BaseLayout requireAuth={false}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Age Verification and Adult Content Notice</h2>
            <p>
              Due to the mature nature of our service, we collect and process age verification data to ensure compliance with legal requirements. By using Girlfriend.cx, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>We collect and verify age-related information to ensure users are 18+ or of legal age in their jurisdiction</li>
              <li>You consent to our processing of this information for compliance purposes</li>
              <li>False information about age may result in immediate account termination</li>
              <li>We maintain strict privacy controls around age verification data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <h3 className="text-xl font-semibold mt-4 mb-2">Personal Information:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address</li>
              <li>Name</li>
              <li>Age verification data</li>
              <li>Profile information</li>
              <li>Payment information (processed securely by third-party providers)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Usage Information:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chat logs and interactions with AI companions</li>
              <li>Device information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To verify your age and identity</li>
              <li>To provide and personalize our services</li>
              <li>To improve AI companion interactions</li>
              <li>To ensure platform safety and security</li>
              <li>To comply with legal obligations</li>
              <li>To communicate important updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
            <p>
              We implement robust security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>End-to-end encryption for sensitive data</li>
              <li>Regular security audits</li>
              <li>Strict access controls</li>
              <li>Secure data storage and transmission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Age verification service providers</li>
              <li>Payment processors</li>
              <li>Cloud service providers</li>
              <li>Law enforcement when legally required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Access your personal data</li>
              <li>Request data correction</li>
              <li>Request data deletion</li>
              <li>Withdraw consent</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
            <p>
              We retain your data for as long as necessary to provide our services 
              and comply with legal obligations. Age verification data is retained 
              as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience 
              and collect usage data. You can control these through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Changes to Privacy Policy</h2>
            <p>
              We may update this policy periodically. We will notify you of significant 
              changes via email or platform notifications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
            <p>
              For privacy-related inquiries, please contact our Data Protection Officer at privacy@girlfriend.cx
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