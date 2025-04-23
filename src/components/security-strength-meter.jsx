"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function SecurityStrengthMeter({ percentage }) {
  // Determine the color based on the percentage
  const getStrengthColor = () => {
    if (percentage >= 80) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (percentage >= 60) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (percentage >= 40) return "bg-gradient-to-r from-yellow-500 to-amber-500";
    return "bg-gradient-to-r from-red-500 to-rose-500";
  };

  // Determine the strength label
  const getStrengthLabel = () => {
    if (percentage >= 80) return "Strong";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Fair";
    return "Weak";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Password Strength</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{getStrengthLabel()}</span>
            <span className="text-sm font-medium">{percentage}%</span>
          </div>
          
          {/* Custom progress bar with gradient */}
          <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStrengthColor()}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {/* Strength indicators */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Weak</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Strong</span>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Your password strength is calculated based on the uniqueness and complexity of your passwords across all your accounts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
