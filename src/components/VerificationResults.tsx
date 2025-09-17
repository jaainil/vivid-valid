import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmailResult } from "@/pages/Index";
import { CheckCircle, XCircle, AlertTriangle, Search, Download, Filter, Shield, Activity, Zap } from "lucide-react";

interface VerificationResultsProps {
  results: EmailResult[];
}

export const VerificationResults = ({ results }: VerificationResultsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredResults = results.filter(result => {
    const matchesSearch = result.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "all" || result.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: results.length,
    valid: results.filter(r => r.status === 'valid').length,
    invalid: results.filter(r => r.status === 'invalid').length,
    risky: results.filter(r => r.status === 'risky').length,
  };

  const getStatusIcon = (status: EmailResult['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'risky':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const downloadResults = (filterStatus?: string) => {
    const dataToDownload = filterStatus ? 
      results.filter(r => r.status === filterStatus) : 
      filteredResults;
    
    const csv = [
      'Email,Status,Reason,Score,Format,Domain,MX,SMTP,Reputation,Deliverability,SPF,DKIM,DMARC,Blacklisted,Timestamp',
      ...dataToDownload.map(result => 
        `${result.email},${result.status},${result.reason},${result.score || 0},${result.factors?.format || false},${result.factors?.domain || false},${result.factors?.mx || false},${result.factors?.smtp || false},${result.factors?.reputation || 0},${result.factors?.deliverability || 0},${result.domainHealth?.spf || false},${result.domainHealth?.dkim || false},${result.domainHealth?.dmarc || false},${result.domainHealth?.blacklisted || false},${new Date(result.timestamp).toISOString()}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filterStatus || 'all'}-emails-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </Card>
        
        <Card className="glass-card p-4 text-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => downloadResults('valid')}>
          <div className="text-2xl font-bold text-success">{stats.valid}</div>
          <div className="text-sm text-muted-foreground">Valid</div>
          <Download className="h-3 w-3 mx-auto mt-1 opacity-60" />
        </Card>
        
        <Card className="glass-card p-4 text-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => downloadResults('risky')}>
          <div className="text-2xl font-bold text-warning">{stats.risky}</div>
          <div className="text-sm text-muted-foreground">Risky</div>
          <Download className="h-3 w-3 mx-auto mt-1 opacity-60" />
        </Card>
        
        <Card className="glass-card p-4 text-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => downloadResults('invalid')}>
          <div className="text-2xl font-bold text-destructive">{stats.invalid}</div>
          <div className="text-sm text-muted-foreground">Invalid</div>
          <Download className="h-3 w-3 mx-auto mt-1 opacity-60" />
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              <Filter className="mr-1 h-3 w-3" />
              All
            </Button>
            
            <Button
              variant={statusFilter === "valid" ? "default" : "outline"}
              onClick={() => setStatusFilter("valid")}
              size="sm"
              className={statusFilter === "valid" ? "btn-success" : ""}
            >
              Valid
            </Button>
            
            <Button
              variant={statusFilter === "risky" ? "default" : "outline"}
              onClick={() => setStatusFilter("risky")}
              size="sm"
            >
              Risky
            </Button>
            
            <Button
              variant={statusFilter === "invalid" ? "default" : "outline"}
              onClick={() => setStatusFilter("invalid")}
              size="sm"
            >
              Invalid
            </Button>
          </div>
          
          <Button onClick={() => downloadResults()} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </Card>

      {/* Results List */}
      <Card className="glass-card">
        <div className="max-h-96 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm || statusFilter !== "all" ? 
                "No results match your filters" : 
                "No verification results yet"
              }
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredResults.map((result) => (
                <div 
                  key={result.id}
                  className="p-4 hover:bg-muted/10 transition-colors animate-slide-up"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(result.status)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.email}</div>
                        <div className="text-sm text-muted-foreground">{result.reason}</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {result.score !== undefined && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-primary" />
                            <span className="text-sm font-medium">{result.score}/100</span>
                          </div>
                        )}
                        
                        <Badge className={`status-${result.status} border text-xs`}>
                          {result.status.toUpperCase()}
                        </Badge>
                        
                        <div className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Advanced Details */}
                    {result.factors && (
                      <div className="pl-8 space-y-2">
                        {/* Verification Factors */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className={`flex items-center gap-1 ${result.factors.format ? 'text-success' : 'text-destructive'}`}>
                            <CheckCircle className="h-3 w-3" />
                            Format
                          </div>
                          <div className={`flex items-center gap-1 ${result.factors.domain ? 'text-success' : 'text-destructive'}`}>
                            <CheckCircle className="h-3 w-3" />
                            Domain
                          </div>
                          <div className={`flex items-center gap-1 ${result.factors.mx ? 'text-success' : 'text-destructive'}`}>
                            <CheckCircle className="h-3 w-3" />
                            MX
                          </div>
                          <div className={`flex items-center gap-1 ${result.factors.smtp ? 'text-success' : 'text-destructive'}`}>
                            <Zap className="h-3 w-3" />
                            SMTP
                          </div>
                        </div>

                        {/* Domain Health */}
                        {result.domainHealth && (
                          <div className="flex items-center gap-4 text-xs">
                            <div className={`flex items-center gap-1 ${result.domainHealth.spf ? 'text-success' : 'text-muted-foreground'}`}>
                              SPF: {result.domainHealth.spf ? '✓' : '✗'}
                            </div>
                            <div className={`flex items-center gap-1 ${result.domainHealth.dkim ? 'text-success' : 'text-muted-foreground'}`}>
                              DKIM: {result.domainHealth.dkim ? '✓' : '✗'}
                            </div>
                            <div className={`flex items-center gap-1 ${result.domainHealth.dmarc ? 'text-success' : 'text-muted-foreground'}`}>
                              DMARC: {result.domainHealth.dmarc ? '✓' : '✗'}
                            </div>
                            {result.domainHealth.blacklisted && (
                              <Badge variant="destructive" className="text-xs">Blacklisted</Badge>
                            )}
                          </div>
                        )}

                        {/* Suggestions */}
                        {result.suggestions && result.suggestions.length > 0 && (
                          <div className="text-xs text-warning">
                            💡 {result.suggestions[0]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};