import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfUse() {
  const lastUpdated = "December 12, 2024";
  const appName = "NU MELODIC";
  const contactEmail = "legal@numelodic.com";

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
          <h1 className="text-3xl font-bold mb-2">Terms of Use</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              Welcome to {appName}. By accessing or using our music streaming application and related services (collectively, the "Service"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, please do not use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page. Your continued use of the Service after changes are posted constitutes your acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              {appName} is a personal music streaming service that provides access to original musical content. All music available on {appName} is original work created by the artist who retains full copyright ownership of all music material. The Service allows users to:
            </p>
            <ul className="list-disc pl-6">
              <li>Stream original music content</li>
              <li>Create and manage personal playlists</li>
              <li>Access music through web browsers and compatible devices</li>
              <li>Use voice commands through Amazon Alexa integration</li>
              <li>Subscribe to premium features for enhanced access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            
            <h3 className="text-lg font-medium mb-2">3.1 Account Creation</h3>
            <p>
              To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>

            <h3 className="text-lg font-medium mb-2">3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
            </p>

            <h3 className="text-lg font-medium mb-2">3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account at any time for any reason, including violation of these Terms. You may also delete your account at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Subscription and Payment</h2>
            
            <h3 className="text-lg font-medium mb-2">4.1 Free and Premium Access</h3>
            <p>
              The Service offers both free and premium subscription tiers. Free users may have limited access to certain features, including preview-only playback of tracks.
            </p>

            <h3 className="text-lg font-medium mb-2">4.2 Premium Subscriptions</h3>
            <p>
              Premium subscriptions provide full access to all features, including complete track playback and download capabilities. Subscription fees are billed in advance on a recurring basis.
            </p>

            <h3 className="text-lg font-medium mb-2">4.3 Payment Processing</h3>
            <p>
              Payments are processed through third-party payment providers (Stripe and PayPal). By subscribing, you agree to their respective terms of service. All fees are non-refundable except as required by applicable law.
            </p>

            <h3 className="text-lg font-medium mb-2">4.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Cancellation will take effect at the end of the current billing period. You will continue to have access to premium features until the end of your paid period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property Rights</h2>
            
            <h3 className="text-lg font-medium mb-2">5.1 Music Content</h3>
            <p>
              All musical content available on {appName} is original work. The artist retains full copyright ownership of all music, lyrics, compositions, and recordings. Users are granted a limited, non-exclusive, non-transferable license to stream the music for personal, non-commercial use only.
            </p>

            <h3 className="text-lg font-medium mb-2">5.2 Prohibited Uses</h3>
            <p>You may NOT:</p>
            <ul className="list-disc pl-6">
              <li>Copy, reproduce, distribute, or publicly perform any music from the Service</li>
              <li>Create derivative works based on the music content</li>
              <li>Use the music for commercial purposes without explicit written permission</li>
              <li>Circumvent any digital rights management or copy protection measures</li>
              <li>Record, download (except as permitted for premium users), or capture audio streams</li>
              <li>Share, sell, or sublicense access to the music</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">5.3 Platform Content</h3>
            <p>
              The Service, including its design, features, and functionality, is owned by {appName} and is protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others, including intellectual property rights</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Use automated means (bots, scrapers, etc.) to access the Service</li>
              <li>Interfere with or disrupt the Service or servers connected to it</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service for any commercial purpose without authorization</li>
              <li>Upload or transmit viruses or malicious code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6">
              <li><strong>Amazon Alexa:</strong> For voice-controlled music playback. Use of Alexa is subject to Amazon's terms of service.</li>
              <li><strong>Payment Processors:</strong> Stripe and PayPal for subscription payments. Subject to their respective terms.</li>
            </ul>
            <p className="mt-4">
              We are not responsible for the content, privacy policies, or practices of third-party services. Your use of such services is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Disclaimers</h2>
            
            <h3 className="text-lg font-medium mb-2">8.1 Service Availability</h3>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>

            <h3 className="text-lg font-medium mb-2">8.2 Content Accuracy</h3>
            <p>
              While we strive to provide accurate information, we make no warranties about the accuracy, completeness, or reliability of any content available through the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {appName.toUpperCase()} AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
            </p>
            <p className="mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless {appName} and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney fees, arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, or your violation of any rights of another.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which {appName} operates, without regard to its conflict of law provisions.
            </p>
            <p className="mt-4">
              Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes may be submitted to binding arbitration in accordance with applicable arbitration rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and {appName} regarding your use of the Service and supersede any prior agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> {contactEmail}<br />
              <strong>Subject:</strong> Terms of Use Inquiry
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">15. Additional Terms</h2>
            
            <h3 className="text-lg font-medium mb-2">15.1 Age Requirement</h3>
            <p>
              You must be at least 13 years old (or 16 in the European Economic Area) to use the Service. By using the Service, you represent that you meet this age requirement.
            </p>

            <h3 className="text-lg font-medium mb-2">15.2 Export Compliance</h3>
            <p>
              You agree to comply with all applicable export and import laws and regulations in your use of the Service.
            </p>

            <h3 className="text-lg font-medium mb-2">15.3 No Waiver</h3>
            <p>
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
