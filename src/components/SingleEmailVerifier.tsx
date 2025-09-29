import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmailResult } from "@/pages/Index";
import {
  validateEmailReal,
  suggestEmailCorrections,
  commonTypos,
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
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface SingleEmailVerifierProps {
  onResult: (result: EmailResult) => void;
}

const SingleEmailVerifier = ({ onResult }: SingleEmailVerifierProps) => {
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<string>("unknown");
  const [useStrictMode, setUseStrictMode] = useState<boolean>(false);

  const steps = [
    "Checking email format...",
    "Validating domain...",
    "Looking up MX records...",
    "Testing SMTP connection...",
    "Analyzing reputation...",
    "Checking domain health...",
    "Calculating trust score...",
  ];

  const handleEmailChange = (value: string) => {
    setEmail(value);

    // Real-time suggestion checking
    if (value.includes("@")) {
      const newSuggestions = suggestEmailCorrections(value);
      setSuggestions(newSuggestions);
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
    } catch (error) {
      setBackendStatus("failed");
      console.error("Connection test failed:", error);
    }
  };

  const verifyEmail = async () => {
    if (!email.trim()) return;

    setIsVerifying(true);
    setCurrentStep(0);
    setProgress(0);
    setSuggestions([]);

    // Create initial result
    const result: EmailResult = {
      id: Date.now().toString(),
      email,
      status: "checking",
      reason: "Verification in progress...",
      timestamp: Date.now(),
      score: 0,
      factors: {
        format: false,
        domain: false,
        mx: false,
        smtp: false,
        reputation: 0,
        deliverability: 0,
      },
      domainHealth: {
        spf: false,
        dkim: false,
        dmarc: false,
        blacklisted: false,
        reputation: 0,
      },
    };

    onResult(result);

    try {
      console.log("Starting validation for email:", email);

      // Get actual analysis from backend
      const analysis = await validateEmailReal(email, { useStrictMode });

      console.log("Backend analysis result:", analysis);

      // Show progress through validation steps
      const validationSteps = analysis.checks_performed || steps;
      for (let i = 0; i < validationSteps.length; i++) {
        setCurrentStep(i);
        setProgress((i / (validationSteps.length - 1)) * 100);

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const finalResult: EmailResult = {
        ...result,
        email: analysis.input, // Map backend 'input' to frontend 'email'
        status: analysis.status === "error" ? "invalid" : analysis.status,
        reason: analysis.reason,
        score: analysis.score,
        factors: analysis.factors,
        suggestions: analysis.suggestion
          ? [analysis.suggestion]
          : analysis.suggestions || [],
        domainHealth: analysis.domainHealth,
        timestamp: Date.now(),
        // Map strict mode properties
        normalized_email: analysis.normalized_email,
        is_role_based: analysis.is_role_based,
        is_catch_all: analysis.is_catch_all,
        gmail_normalized: analysis.gmail_normalized,
        has_plus_alias: analysis.has_plus_alias,
        checks_performed: analysis.checks_performed,
      };

      console.log("Final result to display:", finalResult);
      onResult({ ...finalResult, strictMode: useStrictMode });
    } catch (error) {
      console.error("Validation failed:", error);

      const errorResult: EmailResult = {
        ...result,
        status: "invalid",
        reason: `Validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        score: 0,
        timestamp: Date.now(),
      };

      console.log("Error result:", errorResult);
      onResult(errorResult);
    }

    setIsVerifying(false);
    setEmail("");
    setProgress(0);
    setCurrentStep(0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">
          Single Email Verification
        </h2>
        <p className="text-muted-foreground">
          Advanced email verification with reputation scoring and domain health
          analysis
        </p>

        {/* Strict Mode Toggle */}
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                !useStrictMode ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Standard Mode
            </span>
            <button
              onClick={() => setUseStrictMode(!useStrictMode)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isVerifying}
            >
              <span className="sr-only">Toggle strict mode</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useStrictMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                useStrictMode ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Strict Mode
            </span>
            {useStrictMode && (
              <Badge variant="destructive" className="ml-2">
                MAX SECURITY
              </Badge>
            )}
          </div>
        </div>

        {/* Backend Connection Status */}
        <div className="mt-4">
          <Button
            onClick={testConnection}
            variant="outline"
            size="sm"
            className="mb-2"
          >
            Test Backend Connection
          </Button>
          <div className="text-sm">
            Backend Status:{" "}
            <span
              className={`font-medium ${
                backendStatus === "connected"
                  ? "text-green-600"
                  : backendStatus === "failed"
                  ? "text-red-600"
                  : backendStatus === "testing"
                  ? "text-yellow-600"
                  : "text-gray-600"
              }`}
            >
              {backendStatus === "connected"
                ? "✅ Connected"
                : backendStatus === "failed"
                ? "❌ Failed"
                : backendStatus === "testing"
                ? "🔄 Testing..."
                : "❓ Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="Enter email address..."
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && !isVerifying && verifyEmail()
            }
            disabled={isVerifying}
            className="text-lg p-6"
          />

          <Button
            onClick={verifyEmail}
            disabled={!email.trim() || isVerifying}
            className="btn-hero px-8 py-6 text-lg"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Verify
              </>
            )}
          </Button>
        </div>

        {/* Syntax Suggestions */}
        {suggestions.length > 0 && (
          <Card className="glass-card p-4 border-warning/20">
            <div className="flex items-start gap-3">
              <Wand2 className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-warning mb-2">Suggestions</h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{suggestion}</span>
                      {suggestion.includes("Did you mean:") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySuggestion(suggestion)}
                          className="ml-2"
                        >
                          Fix
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {isVerifying && (
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">{steps[currentStep]}</span>
            </div>

            <Progress value={progress} className="h-3" />

            <div className="grid grid-cols-4 gap-3 text-center">
              <div
                className={`p-3 rounded-lg transition-all duration-500 ${
                  currentStep >= 0
                    ? "bg-success/20 text-success"
                    : "bg-muted/20"
                }`}
              >
                <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                <div className="text-xs">Format</div>
              </div>

              <div
                className={`p-3 rounded-lg transition-all duration-500 ${
                  currentStep >= 2
                    ? "bg-success/20 text-success"
                    : "bg-muted/20"
                }`}
              >
                <Mail className="h-4 w-4 mx-auto mb-1" />
                <div className="text-xs">Domain</div>
              </div>

              <div
                className={`p-3 rounded-lg transition-all duration-500 ${
                  currentStep >= 4
                    ? "bg-warning/20 text-warning"
                    : "bg-muted/20"
                }`}
              >
                <Activity className="h-4 w-4 mx-auto mb-1" />
                <div className="text-xs">Reputation</div>
              </div>

              <div
                className={`p-3 rounded-lg transition-all duration-500 ${
                  currentStep >= 6
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/20"
                }`}
              >
                <Shield className="h-4 w-4 mx-auto mb-1" />
                <div className="text-xs">Score</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export { SingleEmailVerifier };
