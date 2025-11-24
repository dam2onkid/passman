"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export function PasswordGenerator({ onCancel, onUsePassword }) {
  const [password, setPassword] = useState("");
  const [passwordLength, setPasswordLength] = useState(20);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);

  useEffect(() => {
    generatePassword();
  }, [passwordLength, includeNumbers, includeSymbols]);

  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let chars = lowercase + uppercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    let newPassword = "";
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      newPassword += chars[randomIndex];
    }

    setPassword(newPassword);
  };

  const handleUse = () => {
    if (onUsePassword) {
      onUsePassword(password);
    }
  };

  return (
    <div className="space-y-6 bg-black text-white">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          className="rounded-md text-sm font-medium bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-white hover:bg-zinc-800"
          onClick={generatePassword}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
          onClick={handleUse}
        >
          Use
        </Button>
      </div>

      <div className="relative mb-8">
        <Input
          value={password}
          readOnly
          className="h-16 text-center font-mono text-lg bg-zinc-900 border-zinc-800 text-white"
        />
      </div>

      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-green-500"
          style={{ width: `${(passwordLength / 30) * 100}%` }}
        />
      </div>

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-white">Characters</span>
          <div className="flex items-center gap-4 w-3/5">
            <Slider
              value={[passwordLength]}
              min={8}
              max={30}
              step={1}
              className="flex-1"
              onValueChange={(value) => setPasswordLength(value[0])}
            />
            <div className="bg-white text-black rounded-md px-3 py-2 min-w-[48px] text-center font-medium">
              {passwordLength}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-white">Numbers</span>
          <Switch
            checked={includeNumbers}
            onCheckedChange={setIncludeNumbers}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-white">Symbols</span>
          <Switch
            checked={includeSymbols}
            onCheckedChange={setIncludeSymbols}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </div>
    </div>
  );
}
