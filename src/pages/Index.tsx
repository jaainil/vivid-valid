import { useState } from "react";
import { SingleEmailVerifier } from "@/components/SingleEmailVerifier";
import { BulkEmailVerifier } from "@/components/BulkEmailVerifier";
import { VerificationResults } from "@/components/VerificationResults";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Zap, CheckCircle, Users, Activity, Lock, Mail, Server, Eye, FileCheck, HelpCircle, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface EmailResult {
  id: string;
  email: string;
  status: "valid" | "invalid" | "risky" | "checking" | "error";
  reason: string;
  timestamp: number;
  score: number;
  factors: {
    format: boolean;
    domain: boolean;
    mx: boolean;
    smtp: boolean;
    reputation: number;
    deliverability: number;
  };
  suggestions?: string[];
  domainHealth: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    blacklisted: boolean;
    reputation: number;
  };
  normalized_email?: string;
  is_role_based?: boolean;
  is_catch_all?: boolean;
  gmail_normalized?: string;
  has_plus_alias?: boolean;
  checks_performed?: string[];
  strictMode?: boolean;
}

const Index = () => {
  const [results, setResults] = useState<EmailResult[]>([]);
  const [activeTab, setActiveTab] = useState("single");

  const addResult = (result: EmailResult) => {
    setResults((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
  };

  const addBulkResults = (newResults: EmailResult[]) => {
    setResults((prev) => [...newResults, ...prev]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const faqItems = [
    {
      question: "What is OpenMailValidator?",
      answer: "OpenMailValidator is a free email verification tool developed by Aexaware Infotech that validates email addresses in real-time with 99.9% accuracy. It checks email format, domain validity, MX records, SMTP connectivity, and provides deliverability scoring."
    },
    {
      question: "Is OpenMailValidator free to use?",
      answer: "Yes, OpenMailValidator offers a free tier for single email verification and limited bulk processing. Users can verify individual emails instantly or upload CSV/TXT files for batch verification."
    },
    {
      question: "How accurate is OpenMailValidator?",
      answer: "OpenMailValidator achieves 99.9% accuracy through its 7-layer validation process including format checking, DNS verification, MX record validation, SMTP handshake testing, reputation scoring, and deliverability analysis."
    },
    {
      question: "What is bulk email verification?",
      answer: "Bulk email verification allows users to upload a list of email addresses (CSV or TXT format) and verify them in batch. OpenMailValidator processes thousands of emails with real-time progress tracking and detailed analytics."
    },
    {
      question: "Does OpenMailValidator check domain health?",
      answer: "Yes, OpenMailValidator performs comprehensive domain health checks including SPF (Sender Policy Framework), DKIM (DomainKeys Identified Mail), DMARC (Domain-based Message Authentication), and blacklist status verification."
    },
    {
      question: "What is SMTP validation?",
      answer: "SMTP validation tests whether a mail server accepts email for a given address by performing a real SMTP handshake. This is the most accurate method to verify if an email actually exists and can receive messages."
    },
    {
      question: "Can I detect disposable email addresses?",
      answer: "Yes, OpenMailValidator can detect disposable/temporary email addresses commonly used to bypass registration. This helps businesses reduce spam signups and maintain email list quality."
    },
    {
      question: "Who developed OpenMailValidator?",
      answer: "OpenMailValidator is developed and maintained by Aexaware Infotech Pvt. Ltd., a digital services agency based in Vadodara, India. Founded in 2025 by Axit Padaliya, Aexaware specializes in custom software, web development, mobile apps, and AI/ML solutions."
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(185 95% 55%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "hsl(38 98% 58%)" }}
        />
        <div
          className="absolute top-1/2 left-0 w-64 h-64 rounded-full opacity-6 blur-3xl"
          style={{ background: "hsl(270 70% 50%)" }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-border/50 backdrop-blur-xl" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(185 95% 55%), hsl(185 95% 70%))", boxShadow: "0 0 16px hsl(185 95% 55% / 0.4)" }}
            >
              <Shield className="w-4 h-4 text-black" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Open<span className="text-primary">Mail</span>Validator
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">
                by <a href="https://aexaware.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Aexaware Infotech</a>
              </span>
            </div>
          </div>

          {/* Status pills */}
          <div className="hidden md:flex items-center gap-3">
            <Badge
              variant="outline"
              className="gap-1.5 border-success/30 text-success bg-success/10 text-xs font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              API Online
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 border-border text-muted-foreground text-xs font-mono"
            >
              v2.0.0
            </Badge>
          </div>

          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-14 animate-slide-up">
          {/* Tag line */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-12 bg-primary/40" />
            <span className="text-xs font-mono text-primary/80 tracking-widest uppercase">
              Free Email Verification Tool
            </span>
            <div className="h-px w-12 bg-primary/40" />
          </div>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 leading-none tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <span className="text-gradient">Verify.</span>{" "}
            <span className="text-foreground/90">Validate.</span>{" "}
            <span className="text-gradient">Deliver.</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Military-grade email verification with real-time SMTP validation,
            domain health checks, and beautiful analytics. Free tool by <strong>Aexaware Infotech</strong>.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            {[
              { icon: Zap, label: "< 2s avg", sub: "Verification speed" },
              { icon: CheckCircle, label: "99.9%", sub: "Accuracy rate" },
              { icon: Activity, label: "7-layer", sub: "Deep validation" },
              { icon: Lock, label: "WCAG AA", sub: "Accessible" },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={sub}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur"
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground font-mono">{label}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div
          className="max-w-4xl mx-auto mb-16 rounded-2xl border border-border/60 overflow-hidden"
          style={{
            background: "hsl(var(--card) / 0.6)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px -12px hsl(222 20% 2% / 0.8), 0 0 0 1px hsl(185 95% 55% / 0.08)",
          }}
        >
          {/* Panel header bar */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50 bg-card/30">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-warning/60" />
            <div className="w-3 h-3 rounded-full bg-success/60" />
            <div className="flex-1" />
            <span className="text-xs font-mono text-muted-foreground">verification.engine</span>
          </div>

          <div className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 border border-border/50 p-1 rounded-xl h-auto">
                <TabsTrigger
                  value="single"
                  className="rounded-lg py-3 font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-all"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Single Email
                </TabsTrigger>
                <TabsTrigger
                  value="bulk"
                  className="rounded-lg py-3 font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-all"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Bulk Verification
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-6 mt-0">
                <SingleEmailVerifier onResult={addResult} />
              </TabsContent>

              <TabsContent value="bulk" className="space-y-6 mt-0">
                <BulkEmailVerifier onResults={addBulkResults} />
              </TabsContent>
            </Tabs>

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-10 pt-8 border-t border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2
                      className="text-xl font-bold text-foreground"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      Verification Results
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {results.length} email{results.length > 1 ? "s" : ""} analysed
                    </p>
                  </div>
                  <Button
                    onClick={clearResults}
                    variant="outline"
                    size="sm"
                    className="border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
                  >
                    Clear All
                  </Button>
                </div>
                <VerificationResults results={results} />
              </div>
            )}
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-20 max-w-4xl mx-auto">
          {[
            {
              icon: Zap,
              color: "warning",
              hsl: "38 98% 58%",
              title: "Lightning Fast",
              desc: "Real-time SMTP validation with sub-2-second results — no compromises.",
            },
            {
              icon: CheckCircle,
              color: "success",
              hsl: "152 72% 45%",
              title: "99.9% Accurate",
              desc: "7-layer deep validation: format, DNS, MX, SMTP, reputation & more.",
            },
            {
              icon: Users,
              color: "primary",
              hsl: "185 95% 55%",
              title: "Bulk Processing",
              desc: "Upload CSV/TXT and process thousands of emails with live progress.",
            },
          ].map(({ icon: Icon, hsl, title, desc }) => (
            <div
              key={title}
              className="group p-6 rounded-xl border border-border/50 bg-card/40 backdrop-blur hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              style={{
                boxShadow: "0 4px 20px -4px hsl(222 20% 2% / 0.5)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `hsl(${hsl} / 0.15)`,
                  border: `1px solid hsl(${hsl} / 0.25)`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: `hsl(${hsl})` }} />
              </div>
              <h3
                className="font-bold text-foreground mb-2"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Section */}
        <section className="max-w-4xl mx-auto mb-20" aria-labelledby="why-choose-heading">
          <h2 id="why-choose-heading" className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "'Syne', sans-serif" }}>
            Why Choose <span className="text-primary">OpenMailValidator</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Mail, title: "Real-time Validation", desc: "Instant email verification with detailed status reporting and scoring." },
              { icon: Server, title: "Domain Health Check", desc: "Comprehensive SPF, DKIM, DMARC verification and blacklist monitoring." },
              { icon: Eye, title: "Catch-all Detection", desc: "Identify catch-all domains and role-based email addresses instantly." },
              { icon: FileCheck, title: "Bulk List Cleaning", desc: "Upload CSV/TXT files to clean thousands of email addresses at once." }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card/30">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto mb-20" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Common questions about OpenMailValidator email verification service
          </p>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA Section */}
        <section className="max-w-3xl mx-auto mb-20" aria-labelledby="cta-heading">
          <div className="text-center p-10 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
            <h2 id="cta-heading" className="text-2xl font-bold mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Need Custom Email Verification Solution?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Aexaware Infotech provides custom email verification APIs and enterprise solutions. 
              Contact us for bulk processing, white-label options, or API integration.
            </p>
            <a 
              href="https://aexaware.com/contact" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Contact Aexaware Infotech
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center border-t border-border/30 pt-8 pb-12">
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground">
              OpenMailValidator by <a href="https://aexaware.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Aexaware Infotech Pvt. Ltd.</a>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Digital services agency based in Vadodara, India
            </p>
          </div>
          <p className="text-xs font-mono text-muted-foreground/60">
            OpenMailValidator &copy; {new Date().getFullYear()} — Built with precision &amp; ❤️
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
