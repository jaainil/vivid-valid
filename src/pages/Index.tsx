import { useState } from "react";
import { SingleEmailVerifier } from "@/components/SingleEmailVerifier";
import { BulkEmailVerifier } from "@/components/BulkEmailVerifier";
import { VerificationResults } from "@/components/VerificationResults";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Zap, CheckCircle, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  // Strict mode additional properties
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
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header with Theme Toggle */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-full glass-card animate-bounce-in">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-success bg-clip-text text-transparent">
            {import.meta.env.VITE_APP_NAME || "Email Verifier Pro"}
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {import.meta.env.VITE_APP_DESCRIPTION || "The most advanced email verification tool with real-time validation, bulk processing, and beautiful progress animations"}
          </p>
        </div>

        {/* Main Verification Interface */}
        <Card className="glass-card p-8 max-w-4xl mx-auto mb-12">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger
                value="single"
                className="data-[state=active]:btn-hero"
              >
                Single Email
              </TabsTrigger>
              <TabsTrigger
                value="bulk"
                className="data-[state=active]:btn-hero"
              >
                Bulk Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6">
              <SingleEmailVerifier onResult={addResult} />
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6">
              <BulkEmailVerifier onResults={addBulkResults} />
            </TabsContent>
          </Tabs>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Verification Results</h2>
                <Button onClick={clearResults} variant="outline">
                  Clear All
                </Button>
              </div>

              <VerificationResults results={results} />
            </div>
          )}
        </Card>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card p-6 text-center hover:scale-105 transition-all duration-300">
            <Zap className="h-8 w-8 text-warning mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Real-time verification with instant results
            </p>
          </Card>

          <Card className="glass-card p-6 text-center hover:scale-105 transition-all duration-300">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-4" />
            <h3 className="font-semibold mb-2">99.9% Accurate</h3>
            <p className="text-sm text-muted-foreground">
              Advanced SMTP validation & domain checking
            </p>
          </Card>

          <Card className="glass-card p-6 text-center hover:scale-105 transition-all duration-300">
            <Users className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Bulk Processing</h3>
            <p className="text-sm text-muted-foreground">
              Process thousands of emails with CSV/TXT upload
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
