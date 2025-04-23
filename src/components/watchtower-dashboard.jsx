"use client";

import { useState } from "react";
import { Share2, Shield, AlertTriangle } from "lucide-react";
import { calculateSecurityScore } from "@/lib/security-utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SecurityScoreCard } from "@/components/security-score-card";
import { SecurityStrengthMeter } from "@/components/security-strength-meter";
import { SecurityCategoryCard } from "@/components/security-category-card";

export function WatchtowerDashboard() {
  const [securityData] = useState(calculateSecurityScore);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const handleShowItems = (category) => {
    setSelectedCategory(category);
    // In a real app, this would navigate to a detail view or open a modal
    console.log(`Show items for ${category}`);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Watchtower</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Monitor and improve your password security
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share My Score
          </Button>
        </div>
      </div>

      {/* Score and Strength Section */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 mb-8">
        <SecurityScoreCard score={securityData.score} rating={securityData.rating} />
        <SecurityStrengthMeter percentage={securityData.strengthPercentage} />
      </div>

      {/* Information Alert */}
      <Alert className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Watchtower analyzes your saved passwords to identify security issues and provide recommendations for improvement.
        </AlertDescription>
      </Alert>

      {/* Security Categories Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SecurityCategoryCard
          title="Reused passwords"
          count={securityData.securityIssues.reusedPasswords.count}
          description={securityData.securityIssues.reusedPasswords.description}
          iconColor="red"
          onShowItems={() => handleShowItems("reusedPasswords")}
        />
        <SecurityCategoryCard
          title="Weak passwords"
          count={securityData.securityIssues.weakPasswords.count}
          description={securityData.securityIssues.weakPasswords.description}
          iconColor="orange"
          onShowItems={() => handleShowItems("weakPasswords")}
        />
        <SecurityCategoryCard
          title="Passkeys available"
          count={securityData.securityIssues.passkeysAvailable.count}
          description={securityData.securityIssues.passkeysAvailable.description}
          iconColor="blue"
          onShowItems={() => handleShowItems("passkeysAvailable")}
        />
        <SecurityCategoryCard
          title="Two-factor authentication"
          count={securityData.securityIssues.twoFactorAuthentication.count}
          description={securityData.securityIssues.twoFactorAuthentication.description}
          iconColor="purple"
          onShowItems={() => handleShowItems("twoFactorAuthentication")}
        />
      </div>
    </div>
  );
}
