import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Stratos Hub" }] }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 lg:p-24">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8 -ml-4 text-muted-foreground">
          <Link to="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: July 2026</p>

          <p>
            At Stratos Hub, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered real estate co-pilot platform.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect information that you voluntarily provide to us when you register on the platform, including:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and company details.</li>
            <li><strong>Uploaded Content:</strong> Real estate listings, property PDFs, and CSV spreadsheets that you upload to be parsed by our AI.</li>
            <li><strong>Client Communications:</strong> Chat histories, lead information, and contact details gathered through our widget and integrated channels (WhatsApp, Messenger, Instagram, TikTok).</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect primarily to provide, maintain, and improve our services:</p>
          <ul>
            <li>To qualify leads automatically and maintain your CRM pipeline.</li>
            <li>To train and instruct your specific AI agent on your property catalog.</li>
            <li>To facilitate omnichannel communication with your buyers and renters.</li>
          </ul>

          <h2>3. Artificial Intelligence &amp; Third-Party Processors</h2>
          <p>
            Stratos Hub leverages advanced AI models (such as Google Gemini) to parse listings and converse with leads. 
            When your leads interact with the AI or when you upload property documents, relevant text is securely processed through these third-party AI APIs. We do not use your private lead data to train public AI models.
          </p>
          <p>
            Additionally, we integrate with third-party messaging platforms (Meta, TikTok). Data transmitted through these channels is subject to their respective privacy policies.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information, including standard encryption protocols for data at rest and in transit. Your passwords are cryptographically hashed and never stored in plain text.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at support@stratoshub.com.
          </p>
        </div>
      </div>
    </div>
  );
}
