"use client";

import { Card, CardContent } from "@/components/ui/card";

export function SecurityScoreCard({ score, rating }) {
  // Calculate the circle's circumference
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the offset based on the score (simplified for demo)
  // For a real app, this would be based on a more sophisticated algorithm
  const normalizedScore = Math.min(Math.max(score, 0), 1200);
  const percentage = normalizedScore / 1200;
  const offset = circumference - (circumference * percentage);
  
  // Determine color based on rating
  const getRatingColor = () => {
    switch (rating) {
      case "FANTASTIC":
        return "text-green-500";
      case "GOOD":
        return "text-blue-500";
      case "FAIR":
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="relative flex items-center justify-center">
          {/* SVG Circle Progress */}
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={getRatingColor()}
              transform="rotate(-90 60 60)"
            />
          </svg>
          
          {/* Score text in the center */}
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold">{score}</span>
            <span className="text-xs text-muted-foreground">SCORE</span>
          </div>
        </div>
        
        {/* Rating text below */}
        <div className={`mt-4 text-lg font-bold ${getRatingColor()}`}>
          {rating}
        </div>
        <p className="text-sm text-muted-foreground text-center mt-2">
          Your overall password security rating
        </p>
      </CardContent>
    </Card>
  );
}
