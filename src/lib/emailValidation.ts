export interface EmailAnalysis {
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'checking';
  reason: string;
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
}

export const commonTypos: Record<string, string> = {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlook.con': 'outlook.com',
  'outlok.com': 'outlook.com',
};

export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const suggestEmailCorrections = (email: string): string[] => {
  const suggestions: string[] = [];
  
  if (!validateEmailFormat(email)) {
    // Check for missing @
    if (!email.includes('@')) {
      suggestions.push('Missing @ symbol in email address');
    }
    
    // Check for multiple @
    if ((email.match(/@/g) || []).length > 1) {
      suggestions.push('Multiple @ symbols found - only one allowed');
    }
  }
  
  // Check for common domain typos
  const [localPart, domain] = email.split('@');
  if (domain && commonTypos[domain.toLowerCase()]) {
    const corrected = `${localPart}@${commonTypos[domain.toLowerCase()]}`;
    suggestions.push(`Did you mean: ${corrected}?`);
  }
  
  // Check for missing TLD
  if (domain && !domain.includes('.')) {
    suggestions.push('Domain missing top-level domain (e.g., .com, .org)');
  }
  
  return suggestions;
};

export const calculateReputationScore = (email: string): number => {
  let score = 50; // Base score
  
  const [localPart, domain] = email.split('@');
  
  // Known good domains
  const trustedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
  if (trustedDomains.includes(domain?.toLowerCase())) {
    score += 30;
  }
  
  // Corporate domains (contains company indicators)
  if (domain && (domain.includes('corp') || domain.includes('company') || domain.length > 15)) {
    score += 20;
  }
  
  // Suspicious patterns
  if (localPart && localPart.includes('noreply')) score -= 20;
  if (localPart && localPart.includes('test')) score -= 15;
  if (localPart && /\d{5,}/.test(localPart)) score -= 10; // Too many numbers
  
  // Domain age simulation (newer domains are riskier)
  if (domain && domain.includes('temp') || domain?.includes('10min')) {
    score -= 40;
  }
  
  return Math.max(0, Math.min(100, score));
};

export const simulateDomainHealth = (domain: string) => {
  const knownGoodDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
  const isKnownGood = knownGoodDomains.includes(domain.toLowerCase());
  
  return {
    spf: isKnownGood ? true : Math.random() > 0.3,
    dkim: isKnownGood ? true : Math.random() > 0.4,
    dmarc: isKnownGood ? true : Math.random() > 0.5,
    blacklisted: isKnownGood ? false : Math.random() > 0.8,
    reputation: isKnownGood ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 60) + 20
  };
};

export const simulateEmailVerification = async (email: string): Promise<EmailAnalysis> => {
  const steps = [
    'Checking email format...',
    'Validating domain...',
    'Looking up MX records...',
    'Testing SMTP connection...',
    'Analyzing reputation...',
    'Checking domain health...',
    'Calculating final score...'
  ];
  
  const [localPart, domain] = email.split('@');
  
  // Simulate step-by-step verification
  const formatValid = validateEmailFormat(email);
  const domainValid = domain && domain.includes('.');
  const mxValid = Math.random() > 0.1; // 90% pass
  const smtpValid = Math.random() > 0.2; // 80% pass
  
  const score = calculateReputationScore(email);
  const domainHealth = simulateDomainHealth(domain || '');
  const suggestions = suggestEmailCorrections(email);
  
  let status: 'valid' | 'invalid' | 'risky' = 'valid';
  let reason = 'Email appears to be valid and deliverable';
  
  if (!formatValid || !domainValid) {
    status = 'invalid';
    reason = 'Invalid email format or domain';
  } else if (score < 40 || domainHealth.blacklisted) {
    status = 'risky';
    reason = 'Email may be risky - low reputation or blacklisted domain';
  } else if (!mxValid || !smtpValid) {
    status = 'invalid';
    reason = 'Domain cannot receive emails';
  }
  
  return {
    email,
    status,
    reason,
    score,
    factors: {
      format: formatValid,
      domain: domainValid,
      mx: mxValid,
      smtp: smtpValid,
      reputation: score,
      deliverability: mxValid && smtpValid ? 85 : 20
    },
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    domainHealth
  };
};