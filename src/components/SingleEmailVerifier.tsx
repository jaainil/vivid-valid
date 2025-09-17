import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmailResult } from "@/pages/Index";
import { Mail, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SingleEmailVerifierProps {
  onResult: (result: EmailResult) => void;
}

interface VerificationStep {
  name: string;
  description: string;
  completed: boolean;
  active: boolean;
}

const verificationSteps = [
  { name: "Format Check", description: "Validating email format", completed: false, active: false },
  { name: "Domain Lookup", description: "Checking domain validity", completed: false, active: false },
  { name: "MX Records", description: "Verifying mail exchange records", completed: false, active: false },
  { name: "SMTP Ping", description: "Testing inbox connectivity", completed: false, active: false },
  { name: "Final Check", description: "Analyzing results", completed: false, active: false },
];

export const SingleEmailVerifier = ({ onResult }: SingleEmailVerifierProps) => {
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState(verificationSteps);
  const [currentResult, setCurrentResult] = useState<EmailResult | null>(null);
  const { toast } = useToast();

  const simulateVerification = async (emailToVerify: string): Promise<EmailResult> => {
    const resultId = Math.random().toString(36).substr(2, 9);
    
    // Simulate different verification steps with realistic timing
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        active: index === i,
        completed: index < i
      })));
      
      setProgress((i + 1) / steps.length * 100);
    }

    // Simulate final result
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock verification logic based on email patterns
    let status: EmailResult['status'];
    let reason: string;

    if (!emailToVerify.includes('@') || !emailToVerify.includes('.')) {
      status = 'invalid';
      reason = 'Invalid email format';
    } else if (emailToVerify.includes('test') || emailToVerify.includes('fake')) {
      status = 'invalid';
      reason = 'Test email detected';
    } else if (emailToVerify.includes('info@') || emailToVerify.includes('admin@')) {
      status = 'risky';
      reason = 'Role-based email';
    } else if (emailToVerify.endsWith('.com') || emailToVerify.endsWith('.org')) {
      status = 'valid';
      reason = 'SMTP verified';
    } else {
      status = 'risky';
      reason = 'Domain uncertain';
    }

    return {
      id: resultId,
      email: emailToVerify,
      status,
      reason,
      timestamp: Date.now()
    };
  };

  const handleVerify = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to verify",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    setProgress(0);
    setCurrentResult(null);
    setSteps(verificationSteps.map(step => ({ ...step, completed: false, active: false })));

    try {
      const result = await simulateVerification(email.trim());
      setCurrentResult(result);
      onResult(result);
      
      setSteps(prev => prev.map(step => ({ ...step, completed: true, active: false })));
      
      toast({
        title: "Verification Complete",
        description: `Email ${result.status}: ${result.reason}`,
        variant: result.status === 'valid' ? "default" : "destructive"
      });
      
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "An error occurred during verification",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (status: EmailResult['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'risky':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getStatusBadge = (status: EmailResult['status']) => {
    const className = `status-${status} border rounded-full px-3 py-1 text-xs font-medium`;
    return (
      <Badge className={className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Email Input */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter email address to verify..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-12 text-lg glass-card border-primary/20 focus:border-primary"
            disabled={isVerifying}
            onKeyPress={(e) => e.key === 'Enter' && !isVerifying && handleVerify()}
          />
        </div>
        
        <Button 
          onClick={handleVerify} 
          disabled={isVerifying || !email.trim()}
          className="btn-hero h-12 px-8"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-verification-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>
      </div>

      {/* Verification Progress */}
      {isVerifying && (
        <Card className="glass-card p-6 animate-slide-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Verification in Progress</h3>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            
            <Progress value={progress} className="progress-glow" />
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div 
                  key={step.name}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    step.active ? 'bg-primary/10 step-pulse' : 
                    step.completed ? 'bg-success/10' : 'bg-muted/10'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    step.completed ? 'bg-success' : 
                    step.active ? 'bg-primary animate-pulse' : 'bg-muted'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                  
                  {step.completed && <CheckCircle className="h-4 w-4 text-success" />}
                  {step.active && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Current Result */}
      {currentResult && !isVerifying && (
        <Card className="glass-card p-6 animate-bounce-in">
          <div className="flex items-center gap-4">
            {getStatusIcon(currentResult.status)}
            
            <div className="flex-1">
              <div className="font-medium">{currentResult.email}</div>
              <div className="text-sm text-muted-foreground">{currentResult.reason}</div>
            </div>
            
            {getStatusBadge(currentResult.status)}
          </div>
        </Card>
      )}
    </div>
  );
};