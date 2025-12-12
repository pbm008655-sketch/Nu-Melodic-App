import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "December 12, 2024";
  const appName = "NU MELODIC";
  const contactEmail = "privacy@numelodic.com";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to {appName} ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our music streaming application and related services (collectively, the "Service").
            </p>
            <p>
              {appName} is a personal music streaming service featuring original music. All musical content available on {appName} is original work created by the artist who owns full copyright to all music material. No third-party copyrighted content is streamed through our Service.
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Information:</strong> When you create an account, we collect your username, email address, and password (stored in encrypted form).</li>
              <li><strong>Payment Information:</strong> If you subscribe to premium features, payment processing is handled by third-party payment processors (Stripe and PayPal). We do not store your complete credit card or bank account numbers.</li>
              <li><strong>Communications:</strong> When you contact us, we may collect your name, email address, and the content of your message.</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Usage Data:</strong> We collect information about how you interact with our Service, including tracks played, playlists created, and listening history.</li>
              <li><strong>Device Information:</strong> We may collect information about the device you use to access our Service, including device type, operating system, and browser type.</li>
              <li><strong>Log Data:</strong> Our servers automatically record information when you access our Service, including your IP address, access times, and pages viewed.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to maintain your session and remember your preferences.</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.3 Voice Assistant Data (Alexa)</h3>
            <p>
              If you use our Alexa skill integration, Amazon processes your voice commands according to their privacy policy. We receive only the text interpretation of your requests necessary to provide the music streaming service. We do not store voice recordings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6">
              <li><strong>Provide and Maintain the Service:</strong> To deliver our music streaming service, process your requests, and manage your account.</li>
              <li><strong>Improve Our Service:</strong> To understand how users interact with our Service and make improvements.</li>
              <li><strong>Process Payments:</strong> To process subscription payments through our third-party payment processors.</li>
              <li><strong>Communicate With You:</strong> To respond to your inquiries and send service-related notifications.</li>
              <li><strong>Personalization:</strong> To remember your preferences and provide a personalized experience.</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues and protect against unauthorized access.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Legal Basis for Processing (GDPR)</h2>
            <p>If you are located in the European Economic Area (EEA), our legal basis for collecting and using your personal information depends on the specific information and context:</p>
            <ul className="list-disc pl-6">
              <li><strong>Contract Performance:</strong> Processing necessary to provide you with the Service you requested.</li>
              <li><strong>Legitimate Interests:</strong> Processing for our legitimate business interests, such as improving our Service and ensuring security.</li>
              <li><strong>Consent:</strong> Where you have given us explicit consent for specific processing activities.</li>
              <li><strong>Legal Obligation:</strong> Processing necessary to comply with legal requirements.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6">
              <li><strong>Service Providers:</strong> We share information with third-party service providers who perform services on our behalf, including:
                <ul className="list-disc pl-6 mt-2">
                  <li>Payment processors (Stripe, PayPal) for subscription management</li>
                  <li>Cloud hosting providers for data storage</li>
                  <li>Email service providers for transactional communications</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, regulation, legal process, or governmental request.</li>
              <li><strong>Protection of Rights:</strong> We may disclose information to protect our rights, privacy, safety, or property, or that of our users or others.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you with our Service. We may also retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <p>
              If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Your Rights and Choices</h2>
            
            <h3 className="text-lg font-medium mb-2">7.1 All Users</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Information:</strong> You can update your account information through your account settings.</li>
              <li><strong>Communications:</strong> You can opt out of promotional communications by following the unsubscribe instructions in those messages.</li>
              <li><strong>Account Deletion:</strong> You can request deletion of your account by contacting us.</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">7.2 European Users (GDPR Rights)</h3>
            <p>If you are in the EEA, you have the following rights:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> Request access to your personal data.</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate personal data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong>Restriction:</strong> Request restriction of processing of your personal data.</li>
              <li><strong>Portability:</strong> Request a copy of your personal data in a portable format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">7.3 California Residents (CCPA/CPRA Rights)</h3>
            <p>If you are a California resident, you have the following rights:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Right to Know:</strong> Request information about personal data collected, used, and disclosed.</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal data.</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate personal data.</li>
              <li><strong>Right to Opt-Out:</strong> We do not sell personal information, so this right does not apply.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
            </ul>
            <p>
              To exercise these rights, please contact us at {contactEmail}. We will respond to your request within the timeframes required by applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6">
              <li>Encryption of data in transit using HTTPS/TLS</li>
              <li>Secure password hashing using industry-standard algorithms</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls limiting who can access personal data</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws different from your country. When we transfer data internationally, we implement appropriate safeguards to protect your information in accordance with applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              Our Service is not directed to children under the age of 13 (or 16 in the EEA). We do not knowingly collect personal information from children under these ages. If we become aware that we have collected personal information from a child under the applicable age, we will take steps to delete such information promptly.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us at {contactEmail}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Third-Party Links and Services</h2>
            <p>
              Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party services you access.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
            <p>
              Your continued use of the Service after any changes to this Privacy Policy constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> {contactEmail}<br />
              <strong>Subject:</strong> Privacy Policy Inquiry
            </p>
            <p className="mt-4">
              For GDPR-related inquiries, you may also contact your local data protection authority if you believe we have not adequately addressed your concerns.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Music Content and Copyright</h2>
            <p>
              All musical content available on {appName} consists of original works. The artist retains full copyright ownership of all music material streamed through this Service. No third-party copyrighted content is distributed through our platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
