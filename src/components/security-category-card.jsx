"use client";

import { ArrowRight, Key, Lock, Shield, Fingerprint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SecurityCategoryCard({ title, count, description, iconColor, onShowItems }) {
  // Get the appropriate icon and color classes based on the title and iconColor
  const getIconAndClasses = () => {
    // Define color mappings
    const colorMap = {
      red: {
        icon: "text-red-500",
        bg: "bg-red-100"
      },
      orange: {
        icon: "text-orange-500",
        bg: "bg-orange-100"
      },
      blue: {
        icon: "text-blue-500",
        bg: "bg-blue-100"
      },
      purple: {
        icon: "text-purple-500",
        bg: "bg-purple-100"
      }
    };
    
    const colors = colorMap[iconColor] || colorMap.blue;
    
    // Get the appropriate icon based on the title
    let icon;
    switch (title.toLowerCase()) {
      case "reused passwords":
        icon = <Key className={cn("h-5 w-5", colors.icon)} />;
        break;
      case "weak passwords":
        icon = <Lock className={cn("h-5 w-5", colors.icon)} />;
        break;
      case "passkeys available":
        icon = <Shield className={cn("h-5 w-5", colors.icon)} />;
        break;
      case "two-factor authentication":
        icon = <Fingerprint className={cn("h-5 w-5", colors.icon)} />;
        break;
      default:
        icon = <Shield className={cn("h-5 w-5", colors.icon)} />;
    }
    
    return { icon, bgClass: colors.bg };
  };

  const { icon, bgClass } = getIconAndClasses();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", bgClass)}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{count}</span>
              <h3 className="font-medium">{title}</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
            <Button 
              variant="ghost" 
              className="mt-4 px-0 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              onClick={onShowItems}
            >
              Show Items
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
