import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmailResult } from "@/pages/Index";
import {
  validateEmailReal,
  suggestEmailCorrections,
  testBackendConnection,
} from "@/lib/emailValidation";
import {
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Shield,
  Activity,
  Wand2,
  Server,
  Globe,
  AtSign,
  ArrowRight,
} from "lucide-react";

interface SingleEmailVerifierProps {
  onResult: (result: EmailResult) => void;
}

const steps = [
  { label: "Format check", icon: AtSign },
  { label: "Domain lookup", icon: Globe },
  { label: "MX records", icon: Server },
  { label: "SMTP test", icon: Zap },
  { label: "Reputation", icon: Activity },
  { label: "Domain health", icon: Shield },
  { label: "Trust score", icon: CheckCircle },
];

const SingleEmailVerifier = ({ onResult }: SingleEmailVerifierProps) => {
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<string>("unknown");
  const [useStrictMode, setUseStrictMode] = useState<boolean>(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.includes("@")) {
      setSuggestions(suggestEmailCorrections(value));
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const corrected = suggestion.split(": ")[1];
    if (corrected) {
      setEmail(corrected);
      setSuggestions([]);
    }
  };

  const testConnection = async () => {
    setBackendStatus("testing");
    try {
      const isConnected = await testBackendConnection();
      setBackendStatus(isConnected ? "connected" : "failed");
    } catch {
      setBackendStatus("failed");
    }
  };

  const verifyEmail = async () => {
    if (!email.trim()) return;

    setIsVerifying(true);
    setCurrentStep(0);
    setProgress(0);
    setSuggestions([]);

    const result: EmailResult = {
      id: Date.now().toString(),
      email,
      status: "checking",
      reason: "Verification in progress...",
      timestamp: Date.now(),
      score: 0,
      factors: { format: false, domain: false, mx: false, smtp: false, reputation: 0, deliverability: 0 },
      domainHealth: { spf: false, dkim: false, dmarc: false, blacklisted: false, reputation: 0 },
    };

    onResult(result);

    try {
      const analysis = await validateEmailReal(email, { useStrictMode });

      const validationSteps = analysis.checks_performed?.length
        ? analysis.checks_performed
        : steps.map((s) => s.label);

      for (let i = 0; i < validationSteps.length; i++) {
        setCurrentStep(i);
        const total = validationSteps.length;
        setProgress(total > 1 ? (i / (total - 1)) * 100 : 100);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const finalResult: EmailResult = {
        ...result,
        email: analysis.input,
        status: analysis.status === "error" ? "invalid" : analysis.status,
        reason: analysis.reason,
        score: analysis.score,
        factors: analysis.factors,
        suggestions: analysis.suggestion ? [analysis.suggestion] : analysis.suggestions || [],
        domainHealth: analysis.domainHealth,
        timestamp: Date.now(),
        normalized_email: analysis.normalized_email,
        is_role_based: analysis.is_role_based,
        is_catch_all: analysis.is_catch_all,
        gmail_normalized: analysis.gmail_normalized,
        has_plus_alias: analysis.has_plus_alias,
        checks_performed: analysis.checks_performed,
      };

      onResult({ ...finalResult, strictMode: useStrictMode });
    } catch (error) {
      onResult({
        ...result,
        status: "invalid",
        reason: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        score: 0,
        timestamp: Date.now(),
      });
    }

    setIsVerifying(false);
    setEmail("");
    setProgress(0);
    setCurrentStep(0);
  };

  const backendStatusConfig = {
    connected: { color: "hsl(152 72% 45%)", dot: "bg-success", label: "Connected" },
    failed: { color: "hsl(355 85% 58%)", dot: "bg-destructive", label: "Failed" },
    testing: { color: "hsl(38 98% 58%)", dot: "bg-warning animate-pulse", label: "Testing..." },
    unknown: { color: "hsl(215 12% 52%)", dot: "bg-muted-foreground", label: "Unknown" },
  };

  const sc = backendStatusConfig[backendStatus as keyof typeof backendStatusConfig];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold text-foreground mb-1"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Single Email Verification
        </h2>
        <p className="text-sm text-muted-foreground">
          Deep-scan any email address with 7 validation layers and domain health analysis.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border/50">
        {/* Strict mode */}
        <div className="flex items-center gap-3">
          <Switch
            id="strict-mode"
            checked={useStrictMode}
            onCheckedChange={setUseStrictMode}
            disabled={isVerifying}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="strict-mode" className="text-sm cursor-pointer select-none">
            <span className="text-foreground font-medium">Strict Mode</span>
            <span className="ml-2 text-muted-foreground text-xs">Role-based &amp; catch-all detection</span>
          </Label>
          {useStrictMode && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 border text-xs font-mono">
              MAX SEC
            </Badge>
          )}
        </div>

        {/* Backend status */}
        <div className="flex items-center gap-3">
          <button
            onClick={testConnection}
            disabled={backendStatus === "testing"}
            className="text-xs font-mono text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors disabled:opacity-50"
          >
            Test Connection
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            <span className="text-xs font-mono" style={{ color: sc.color }}>
              {sc.label}
            </span>
          </div>
        </div>
      </div>

      {/* Email input */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            />
            <Input
              id="email-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isVerifying && verifyEmail()
              }
              disabled={isVerifying}
              className="pl-11 h-14 text-base font-mono bg-input/50 border-border/60 focus:border-primary/60 rounded-xl transition-all placeholder:text-muted-foreground/40"
            />
          </div>

          <Button
            id="verify-btn"
            onClick={verifyEmail}
            disabled={!email.trim() || isVerifying}
            className="btn-hero h-14 px-8 rounded-xl text-sm font-bold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                Verify
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 rounded-xl border border-warning/25 bg-warning/8 animate-fade-in">
            <div className="flex items-start gap-3">
              <Wand2 className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <h4 className="text-xs font-semibold text-warning uppercase tracking-wider">
                  Smart Suggestions
                </h4>
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-mono">{suggestion}</span>
                    {suggestion.includes("Did you mean:") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion(suggestion)}
                        className="ml-3 h-7 text-xs border-warning/30 text-warning hover:bg-warning/10"
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification progress */}
      {isVerifying && (
        <div className="space-y-5 p-5 rounded-xl border border-border/50 bg-muted/10 animate-fade-in">
          {/* Current step */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "hsl(185 95% 55% / 0.15)",
                border: "1px solid hsl(185 95% 55% / 0.3)",
              }}
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground font-mono">
                {steps[currentStep]?.label ?? "Processing..."}
              </div>
              <div className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <div className="ml-auto text-sm font-mono text-primary font-bold">
              {Math.round(progress)}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress
              value={progress}
              className="h-2 bg-muted/40"
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, hsl(185 95% 55%), hsl(185 95% 70%))",
                boxShadow: "0 0 10px hsl(185 95% 55% / 0.5)",
                maxWidth: "100%",
              }}
            />
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-7 gap-1">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                  aria-label={step.label}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500"
                    style={{
                      background: isDone
                        ? "hsl(152 72% 45% / 0.15)"
                        : isCurrent
                          ? "hsl(185 95% 55% / 0.2)"
                          : "hsl(var(--muted) / 0.3)",
                      border: isDone
                        ? "1px solid hsl(152 72% 45% / 0.3)"
                        : isCurrent
                          ? "1px solid hsl(185 95% 55% / 0.5)"
                          : "1px solid transparent",
                      boxShadow: isCurrent ? "0 0 12px hsl(185 95% 55% / 0.3)" : "none",
                    }}
                  >
                    <Icon
                      className="h-3.5 w-3.5 transition-all duration-500"
                      style={{
                        color: isDone
                          ? "hsl(152 72% 45%)"
                          : isCurrent
                            ? "hsl(185 95% 55%)"
                            : "hsl(var(--muted-foreground))",
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] text-center leading-tight hidden sm:block"
                    style={{
                      color: isDone
                        ? "hsl(152 72% 45%)"
                        : isCurrent
                          ? "hsl(185 95% 55%)"
                          : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {step.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {!isVerifying && !email && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground/50 font-mono">
          <AtSign className="w-3 h-3" />
          <span>Enter an email address above to begin verification</span>
        </div>
      )}
    </div>
  );
};

export { SingleEmailVerifier };
