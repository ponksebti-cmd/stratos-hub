import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Stratos Hub" }] }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  const { t } = useTranslation();

  const sections = [
    {
      title: t("1. Information We Collect"),
      intro: t(
        "We collect information that you voluntarily provide to us when you register on the platform, including:",
      ),
      items: [
        <span key="a">
          <strong>{t("Account Information:")}</strong>{" "}
          {t("Name, email address, and company details.")}
        </span>,
        <span key="b">
          <strong>{t("Uploaded Content:")}</strong>{" "}
          {t(
            "Real estate listings, property PDFs, and spreadsheets that you upload to be parsed by our AI.",
          )}
        </span>,
        <span key="c">
          <strong>{t("Client Communications:")}</strong>{" "}
          {t(
            "Chat histories, lead information, and contact details gathered through our widget and integrated channels (WhatsApp, Messenger, Instagram, TikTok).",
          )}
        </span>,
      ],
    },
    {
      title: t("2. How We Use Your Information"),
      intro: t(
        "We use the information we collect primarily to provide, maintain, and improve our services:",
      ),
      items: [
        t("To capture and qualify leads automatically and maintain your leads pipeline."),
        t("To answer buyer questions using your uploaded property catalog."),
        t("To facilitate omnichannel communication with your buyers and renters."),
      ],
    },
    {
      title: t("3. Artificial Intelligence & Third-Party Processors"),
      intro: t(
        "Stratos Hub uses advanced AI models (such as Google Gemini) to parse listings and converse with leads. When your leads interact with the AI or when you upload property documents, relevant text is securely processed through these third-party AI APIs. We do not use your private lead data to train public AI models.",
      ),
      items: [
        t(
          "Additionally, we integrate with third-party messaging platforms (Meta, TikTok). Data transmitted through these channels is subject to their respective privacy policies.",
        ),
      ],
    },
    {
      title: t("4. Data Security"),
      intro: t(
        "We implement a variety of security measures to maintain the safety of your personal information, including standard encryption protocols for data at rest and in transit. Your passwords are cryptographically hashed and never stored in plain text.",
      ),
      items: [],
    },
    {
      title: t("5. Contact Us"),
      intro: t(
        "If you have questions or comments about this Privacy Policy, please contact us at support@stratoshub.com.",
      ),
      items: [],
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:p-12 lg:p-24">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8 -ms-4 text-muted-foreground">
          <Link to="/">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {t("Back to home")}
          </Link>
        </Button>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1>{t("Privacy Policy")}</h1>
          <p className="lead">{t("Last updated: July 2026")}</p>

          <p>
            {t(
              "At Stratos Hub, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered real estate co-pilot platform.",
            )}
          </p>

          {sections.map((s, i) => (
            <div key={i}>
              <h2>{s.title}</h2>
              <p>{s.intro}</p>
              {s.items.length > 0 && (
                <ul>
                  {s.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
