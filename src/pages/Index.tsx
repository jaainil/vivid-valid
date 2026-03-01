import { useState } from "react";
import { SingleEmailVerifier } from "@/components/SingleEmailVerifier";
import { BulkEmailVerifier } from "@/components/BulkEmailVerifier";
import { VerificationResults } from "@/components/VerificationResults";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Zap, CheckCircle, Users, Activity, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

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
      <nav className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(185 95% 55%), hsl(185 95% 70%))", boxShadow: "0 0 16px hsl(185 95% 55% / 0.4)" }}
            >
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              vivid<span className="text-primary">valid</span>
            </span>
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
              Email Intelligence Platform
            </span>
            <div className="h-px w-12 bg-primary/40" />
          </div>

          <h1
            className="text-6xl md:text-7xl font-extrabold mb-5 leading-none tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <span className="text-gradient">Verify.</span>{" "}
            <span className="text-foreground/90">Protect.</span>{" "}
            <span className="text-gradient">Deliver.</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed font-light">
            Military-grade email verification with real-time SMTP validation,
            domain health checks, and beautiful analytics.
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
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
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

        {/* Footer */}
        <div className="text-center border-t border-border/30 pt-8 pb-12">
          <p className="text-xs font-mono text-muted-foreground/60">
            vividvalid &copy; {new Date().getFullYear()} &mdash; Built with precision &amp; ❤️
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
