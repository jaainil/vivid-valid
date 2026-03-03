import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmailResult } from "@/pages/Index";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  Shield,
  Activity,
  Zap,
  Mail,
  Users,
  AtSign,
  Clock,
  Filter,
  TrendingUp,
} from "lucide-react";

interface VerificationResultsProps {
  results: EmailResult[];
}

type FilterStatus = "all" | "valid" | "risky" | "invalid";

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color =
    score >= 70 ? "hsl(152 72% 45%)" : score >= 40 ? "hsl(38 98% 58%)" : "hsl(355 85% 58%)";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className="score-ring"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: EmailResult["status"] }) {
  const config = {
    valid: { label: "VALID", bg: "hsl(152 72% 45% / 0.12)", color: "hsl(152 72% 50%)", border: "hsl(152 72% 45% / 0.3)" },
    invalid: { label: "INVALID", bg: "hsl(355 85% 58% / 0.12)", color: "hsl(355 85% 62%)", border: "hsl(355 85% 58% / 0.3)" },
    risky: { label: "RISKY", bg: "hsl(38 98% 58% / 0.12)", color: "hsl(38 98% 62%)", border: "hsl(38 98% 58% / 0.3)" },
    checking: { label: "CHECKING", bg: "hsl(185 95% 55% / 0.12)", color: "hsl(185 95% 55%)", border: "hsl(185 95% 55% / 0.3)" },
    error: { label: "ERROR", bg: "hsl(355 85% 58% / 0.12)", color: "hsl(355 85% 62%)", border: "hsl(355 85% 58% / 0.3)" },
  };
  const c = config[status] ?? config.error;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-widest"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}

function FactorDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: ok ? "hsl(152 72% 45%)" : "hsl(355 85% 58%)",
          boxShadow: ok ? "0 0 4px hsl(152 72% 45% / 0.6)" : "none",
        }}
      />
      <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
    </div>
  );
}

export const VerificationResults = ({ results }: VerificationResultsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const filteredResults = results.filter((r) => {
    const matchesSearch = r.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: results.length,
    valid: results.filter((r) => r.status === "valid").length,
    invalid: results.filter((r) => r.status === "invalid").length,
    risky: results.filter((r) => r.status === "risky").length,
  };
  const pct = (n: number) => (stats.total > 0 ? Math.round((n / stats.total) * 100) : 0);

  const downloadResults = (filterStatus?: string) => {
    const data = filterStatus
      ? results.filter((r) => r.status === filterStatus)
      : filteredResults;

    const csv = [
      "Email,Status,Reason,Score,Format,Domain,MX,SMTP,Reputation,Deliverability,SPF,DKIM,DMARC,Blacklisted,Timestamp",
      ...data.map(
        (r) =>
          `${r.email},${r.status},${r.reason},${r.score || 0},${r.factors?.format || false},${r.factors?.domain || false},${r.factors?.mx || false},${r.factors?.smtp || false},${r.factors?.reputation || 0},${r.factors?.deliverability || 0},${r.domainHealth?.spf || false},${r.domainHealth?.dkim || false},${r.domainHealth?.dmarc || false},${r.domainHealth?.blacklisted || false},${new Date(r.timestamp).toISOString()}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filterStatus || "all"}-emails-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: TrendingUp,
            hsl: "185 95% 55%",
            pct: 100,
            onClick: undefined,
          },
          {
            label: "Valid",
            value: stats.valid,
            icon: CheckCircle,
            hsl: "152 72% 45%",
            pct: pct(stats.valid),
            onClick: () => downloadResults("valid"),
          },
          {
            label: "Risky",
            value: stats.risky,
            icon: AlertTriangle,
            hsl: "38 98% 58%",
            pct: pct(stats.risky),
            onClick: () => downloadResults("risky"),
          },
          {
            label: "Invalid",
            value: stats.invalid,
            icon: XCircle,
            hsl: "355 85% 58%",
            pct: pct(stats.invalid),
            onClick: () => downloadResults("invalid"),
          },
        ].map(({ label, value, icon: Icon, hsl, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={!onClick}
            className="group text-left p-4 rounded-xl border border-border/50 bg-card/40 hover:border-primary/30 transition-all duration-300 disabled:cursor-default"
            style={{ boxShadow: "0 4px 16px -4px hsl(222 20% 2% / 0.5)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `hsl(${hsl} / 0.15)`, border: `1px solid hsl(${hsl} / 0.25)` }}
              >
                <Icon className="w-4 h-4" style={{ color: `hsl(${hsl})` }} />
              </div>
              {onClick && (
                <Download className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              )}
            </div>
            <div
              className="text-3xl font-extrabold font-mono mb-0.5"
              style={{ color: `hsl(${hsl})`, fontFamily: "'Syne', sans-serif" }}
            >
              {value}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-border/50 bg-muted/10"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            id="results-search"
            placeholder="Filter emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-input/40 border-border/40 text-sm font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
          {(["all", "valid", "risky", "invalid"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all duration-200"
              style={{
                background:
                  statusFilter === f ? "hsl(185 95% 55%)" : "hsl(var(--muted) / 0.3)",
                color:
                  statusFilter === f ? "hsl(222 20% 5%)" : "hsl(var(--muted-foreground))",
                border: statusFilter === f
                  ? "1px solid hsl(185 95% 55%)"
                  : "1px solid hsl(var(--border) / 0.5)",
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <Button
          onClick={() => downloadResults()}
          variant="outline"
          size="sm"
          className="border-border/50 hover:border-primary/40 hover:text-primary transition-all text-xs font-mono h-9"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Results list */}
      <div
        className="rounded-xl border border-border/50 overflow-hidden"
        style={{ background: "hsl(var(--card) / 0.3)" }}
      >
        <div className="max-h-[480px] overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground/60 font-mono">
                {searchTerm || statusFilter !== "all"
                  ? "No results match your filters"
                  : "No verification results yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredResults.map((result, idx) => (
                <div
                  key={result.id}
                  className="group p-4 hover:bg-primary/4 transition-colors animate-slide-up"
                  style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "backwards" }}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4">
                    {/* Score ring */}
                    {result.score !== undefined && result.score > 0 && (
                      <div className="relative shrink-0">
                        <ScoreRing score={result.score} size={44} />
                        <div
                          className="absolute inset-0 flex items-center justify-center text-[9px] font-bold font-mono"
                          style={{
                            color:
                              result.score >= 70
                                ? "hsl(152 72% 50%)"
                                : result.score >= 40
                                  ? "hsl(38 98% 62%)"
                                  : "hsl(355 85% 62%)",
                          }}
                        >
                          {result.score}
                        </div>
                      </div>
                    )}

                    {/* Email + reason */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm font-medium text-foreground truncate">
                          {result.email}
                        </span>
                        {result.strictMode && (
                          <Badge className="bg-destructive/15 text-destructive border border-destructive/25 text-[9px] font-mono px-1.5 h-4">
                            STRICT
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{result.reason}</p>
                    </div>

                    {/* Status & time */}
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={result.status} />
                      <div className="hidden sm:flex items-center gap-1 text-muted-foreground/50">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-mono">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details row */}
                  {result.factors && (
                    <div className="mt-3 pl-14 flex flex-wrap gap-4">
                      {/* Verification factors */}
                      <div className="flex items-center gap-3">
                        <FactorDot ok={result.factors.format} label="Format" />
                        <FactorDot ok={result.factors.domain} label="Domain" />
                        <FactorDot ok={result.factors.mx} label="MX" />
                        <FactorDot ok={result.factors.smtp} label="SMTP" />
                      </div>

                      {/* Domain health */}
                      {result.domainHealth && (
                        <div className="flex items-center gap-3">
                          <FactorDot ok={result.domainHealth.spf} label="SPF" />
                          <FactorDot ok={result.domainHealth.dkim} label="DKIM" />
                          <FactorDot ok={result.domainHealth.dmarc} label="DMARC" />
                          {result.domainHealth.blacklisted && (
                            <Badge className="bg-destructive/15 text-destructive border border-destructive/25 text-[9px] h-4 px-1.5 font-mono">
                              BLACKLISTED
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Strict mode extras */}
                      {(result.is_role_based || result.is_catch_all || result.has_plus_alias) && (
                        <div className="flex items-center gap-2">
                          {result.is_role_based && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono border-border/50">
                              <Users className="w-2 h-2 mr-1" />
                              ROLE
                            </Badge>
                          )}
                          {result.is_catch_all && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono border-border/50">
                              <AtSign className="w-2 h-2 mr-1" />
                              CATCH-ALL
                            </Badge>
                          )}
                          {result.has_plus_alias && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono border-border/50">
                              +ALIAS
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Normalized email */}
                      {result.normalized_email && result.normalized_email !== result.email && (
                        <div className="flex items-center gap-1 text-muted-foreground/50">
                          <Mail className="w-3 h-3" />
                          <span className="text-[10px] font-mono">{result.normalized_email}</span>
                        </div>
                      )}

                      {/* Suggestion */}
                      {result.suggestions && result.suggestions.length > 0 && (
                        <div className="flex items-center gap-1 text-warning/70">
                          <Zap className="w-3 h-3" />
                          <span className="text-[10px] font-mono">{result.suggestions[0]}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredResults.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-muted/5">
            <span className="text-[10px] font-mono text-muted-foreground/50">
              Showing {filteredResults.length} of {results.length} results
            </span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-[10px] font-mono text-muted-foreground/50">
                {pct(stats.valid)}% deliverable
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
