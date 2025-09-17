import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmailResult } from "@/pages/Index";
import { simulateEmailVerification } from "@/lib/emailValidation";
import { Upload, FileText, Loader2, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
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
  const [progress, setProgress] = useState<BulkProgress>({ total: 0, processed: 0, valid: 0, invalid: 0, risky: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentBatch, setCurrentBatch] = useState<EmailResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseEmailsFromFile = async (file: File): Promise<string[]> => {
    const text = await file.text();
    const emails: string[] = [];
    
    if (file.name.endsWith('.csv')) {
      // Parse CSV - assume emails are in first column or any column
      const lines = text.split('\n');
      lines.forEach(line => {
        const columns = line.split(',').map(col => col.trim().replace(/['"]/g, ''));
        columns.forEach(col => {
          const emailMatch = col.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
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

  const simulateBulkVerification = async (emails: string[]): Promise<EmailResult[]> => {
    const results: EmailResult[] = [];
    const batchSize = 5; // Process in small batches for demo
    
    setProgress({ total: emails.length, processed: 0, valid: 0, invalid: 0, risky: 0 });
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Process batch
      for (const email of batch) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        // Get full analysis for each email
        const analysis = await simulateEmailVerification(email);
        
        const result: EmailResult = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          status: analysis.status,
          reason: analysis.reason,
          timestamp: Date.now(),
          score: analysis.score,
          factors: analysis.factors,
          suggestions: analysis.suggestions,
          domainHealth: analysis.domainHealth
        };

        results.push(result);
        setCurrentBatch(prev => [result, ...prev.slice(0, 9)]); // Show last 10 results
        
        // Update progress
        setProgress(prev => ({
          total: prev.total,
          processed: prev.processed + 1,
          valid: prev.valid + (result.status === 'valid' ? 1 : 0),
          invalid: prev.invalid + (result.status === 'invalid' ? 1 : 0),
          risky: prev.risky + (result.status === 'risky' ? 1 : 0),
        }));
      }
    }
    
    return results;
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.includes('csv') && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or TXT file",
        variant: "destructive"
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
        variant: "destructive"
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
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Processing Started",
        description: `Found ${emails.length} emails to verify`,
      });

      const results = await simulateBulkVerification(emails);
      onResults(results);
      
      toast({
        title: "Bulk Verification Complete",
        description: `Processed ${results.length} emails successfully`,
      });
      
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (currentBatch.length === 0) return;
    
    const csv = [
      'Email,Status,Reason,Timestamp',
      ...currentBatch.map(result => 
        `${result.email},${result.status},${result.reason},${new Date(result.timestamp).toISOString()}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* File Upload Zone */}
      <Card 
        className={`glass-card p-8 border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragOver ? 'drop-zone-active' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Upload className={`h-12 w-12 ${isDragOver ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {uploadedFile ? uploadedFile.name : 'Drop your file here or click to browse'}
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
            'Start Bulk Verification'
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
                <div className="text-2xl font-bold text-muted-foreground">{progress.processed}</div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-success">{progress.valid}</div>
                <div className="text-xs text-muted-foreground">Valid</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-warning">{progress.risky}</div>
                <div className="text-xs text-muted-foreground">Risky</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-destructive">{progress.invalid}</div>
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
                {result.status === 'valid' && <CheckCircle className="h-4 w-4 text-success" />}
                {result.status === 'invalid' && <XCircle className="h-4 w-4 text-destructive" />}
                {result.status === 'risky' && <AlertTriangle className="h-4 w-4 text-warning" />}
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{result.email}</div>
                  <div className="text-xs text-muted-foreground">{result.reason}</div>
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