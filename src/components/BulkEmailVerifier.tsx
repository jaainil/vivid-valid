import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmailResult } from "@/pages/Index";
import { validateEmailBulk } from "@/lib/emailValidation";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkEmailVerifierProps {
  onResults: (results: EmailResult[]) => void;
}

interface BulkProgress {
  total: number;
  processed: number;
  valid: number;
  invalid: number;
  risky: number;
}

export const BulkEmailVerifier = ({ onResults }: BulkEmailVerifierProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkProgress>({
    total: 0,
    processed: 0,
    valid: 0,
    invalid: 0,
    risky: 0,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentBatch, setCurrentBatch] = useState<EmailResult[]>([]);
  const [useStrictMode, setUseStrictMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseEmailsFromFile = async (file: File): Promise<string[]> => {
    const text = await file.text();
    const emails: string[] = [];

    // Hardcoded supported file types
    const supportedFileTypes = [".csv", ".txt"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!supportedFileTypes.includes(fileExtension)) {
      throw new Error(
        `Unsupported file type. Supported types: ${supportedFileTypes.join(
          ", "
        )}`
      );
    }

    if (file.name.endsWith(".csv")) {
      // Parse CSV - assume emails are in first column or any column
      const lines = text.split("\n");
      lines.forEach((line) => {
        const columns = line
          .split(",")
          .map((col) => col.trim().replace(/['"]/g, ""));
        columns.forEach((col) => {
          const emailMatch = col.match(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
          );
          if (emailMatch) {
            emails.push(emailMatch[0]);
          }
        });
      });
    } else {
      // Parse TXT - extract all email-like patterns
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(emailPattern);
      if (matches) {
        emails.push(...matches);
      }
    }

    // Remove duplicates
    return [...new Set(emails)];
  };

  const performBulkVerification = async (
    emails: string[]
  ): Promise<EmailResult[]> => {
    setProgress({
      total: emails.length,
      processed: 0,
      valid: 0,
      invalid: 0,
      risky: 0,
    });

    try {
      // Use the real backend API for bulk validation
      const bulkResult = await validateEmailBulk(emails, {
        enableCache: true,
        checkSyntax: true,
        checkDomain: true,
        checkMX: true,
        checkSMTP: false, // Disable SMTP for bulk to avoid overwhelming
        checkDisposable: true,
        checkTypos: true,
        useStrictMode: useStrictMode,
      });

      // Convert backend results to frontend EmailResult format
      const results: EmailResult[] = bulkResult.results.map((analysis) => ({
        id: Math.random().toString(36).substr(2, 9),
        email: analysis.input, // Backend uses 'input', frontend expects 'email'
        status: analysis.status === "error" ? "invalid" : analysis.status,
        reason: analysis.reason,
        timestamp: Date.now(),
        score: analysis.score,
        factors: analysis.factors,
        suggestions: analysis.suggestion
          ? [analysis.suggestion]
          : analysis.suggestions || [],
        domainHealth: analysis.domainHealth,
        // Map strict mode properties
        normalized_email: analysis.normalized_email,
        is_role_based: analysis.is_role_based,
        is_catch_all: analysis.is_catch_all,
        gmail_normalized: analysis.gmail_normalized,
        has_plus_alias: analysis.has_plus_alias,
        checks_performed: analysis.checks_performed,
        strictMode: useStrictMode,
      }));

      // Simulate progress updates for better UX
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        setCurrentBatch((prev) => [result, ...prev.slice(0, 9)]); // Show last 10 results

        // Update progress
        setProgress((prev) => ({
          total: prev.total,
          processed: i + 1,
          valid: prev.valid + (result.status === "valid" ? 1 : 0),
          invalid: prev.invalid + (result.status === "invalid" ? 1 : 0),
          risky: prev.risky + (result.status === "risky" ? 1 : 0),
        }));

        // Small delay to show progress
        if (i < results.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      return results;
    } catch (error) {
      console.error("Bulk validation failed:", error);
      throw error;
    }
  };

  const handleFileSelect = (file: File) => {
    const maxFileSize = 10485760; // 10MB hardcoded
    const supportedFileTypes = [".csv", ".txt"]; // Hardcoded supported types
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (file.size > maxFileSize) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${Math.round(
          maxFileSize / 1024 / 1024
        )}MB`,
        variant: "destructive",
      });
      return;
    }

    if (!supportedFileTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a ${supportedFileTypes.join(" or ")} file`,
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: "File Uploaded",
      description: `${file.name} is ready for processing`,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const startBulkVerification = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a CSV or TXT file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCurrentBatch([]);

    try {
      const emails = await parseEmailsFromFile(uploadedFile);

      if (emails.length === 0) {
        toast({
          title: "No Emails Found",
          description: "No valid email addresses found in the uploaded file",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing Started",
        description: `Found ${emails.length} emails to verify`,
      });

      const results = await performBulkVerification(emails);
      onResults(results);

      toast({
        title: "Bulk Verification Complete",
        description: `Processed ${results.length} emails successfully`,
      });
    } catch (error) {
      console.error("Bulk validation failed:", error);

      let errorMessage = "An error occurred while processing the file";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Check for specific error types
        if (errorMessage.includes("Cannot connect to backend server")) {
          errorMessage =
            "Cannot connect to backend server. Please ensure the backend is running.";
        } else if (errorMessage.includes("Network error")) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else if (errorMessage.includes("Too many validation requests")) {
          errorMessage =
            "Rate limit exceeded. Please wait a moment before trying again.";
        } else if (errorMessage.includes("Maximum 1000 emails")) {
          errorMessage =
            "File contains too many emails. Maximum 1000 emails allowed per batch.";
        }
      }

      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (currentBatch.length === 0) return;

    const csv = [
      "Email,Status,Reason,Timestamp",
      ...currentBatch.map(
        (result) =>
          `${result.email},${result.status},${result.reason},${new Date(
            result.timestamp
          ).toISOString()}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verification-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPercentage =
    progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Strict Mode Toggle */}
      <div className="flex items-center justify-center">
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
            disabled={isProcessing}
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

      {/* File Upload Zone */}
      <Card
        className={`glass-card p-8 border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragOver
            ? "drop-zone-active"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Upload
              className={`h-12 w-12 ${
                isDragOver
                  ? "text-primary animate-bounce"
                  : "text-muted-foreground"
              }`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              {uploadedFile
                ? uploadedFile.name
                : "Drop your file here or click to browse"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Supports CSV and TXT files with email addresses
            </p>
          </div>

          {uploadedFile && (
            <div className="flex items-center justify-center gap-2 text-sm text-success">
              <FileText className="h-4 w-4" />
              <span>File ready for processing</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
      </Card>

      {/* Start Processing Button */}
      <div className="flex justify-center">
        <Button
          onClick={startBulkVerification}
          disabled={!uploadedFile || isProcessing}
          className="btn-hero px-8 py-3"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-verification-spin" />
              Processing...
            </>
          ) : (
            "Start Bulk Verification"
          )}
        </Button>
      </div>

      {/* Progress Display */}
      {isProcessing && (
        <Card className="glass-card p-6 animate-slide-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Bulk Verification Progress</h3>
              <span className="text-sm text-muted-foreground">
                {progress.processed} / {progress.total}
              </span>
            </div>

            <Progress value={progressPercentage} className="progress-glow" />

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-muted-foreground">
                  {progress.processed}
                </div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-success">
                  {progress.valid}
                </div>
                <div className="text-xs text-muted-foreground">Valid</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-warning">
                  {progress.risky}
                </div>
                <div className="text-xs text-muted-foreground">Risky</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-destructive">
                  {progress.invalid}
                </div>
                <div className="text-xs text-muted-foreground">Invalid</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Results */}
      {currentBatch.length > 0 && (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Verifications</h3>
            <Button onClick={downloadResults} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {currentBatch.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 animate-slide-up"
              >
                {result.status === "valid" && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
                {result.status === "invalid" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                {result.status === "risky" && (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {result.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.reason}
                  </div>
                </div>
                <Badge className={`status-${result.status} border text-xs`}>
                  {result.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
