import { passwordEntries } from "./password-data";

// Function to check if a password is weak (simplified for demo)
const isWeakPassword = (password) => {
  // In a real app, this would use a more sophisticated algorithm
  // For demo purposes, we're considering all passwords weak
  return true;
};

// Function to check if a password is reused
const findReusedPasswords = () => {
  const passwordMap = new Map();
  const reusedEntries = [];

  // Group entries by password
  passwordEntries.forEach(entry => {
    const passwordKey = entry.password; // In real app, this would be a hash
    if (!passwordMap.has(passwordKey)) {
      passwordMap.set(passwordKey, []);
    }
    passwordMap.get(passwordKey).push(entry);
  });

  // Find passwords used more than once
  passwordMap.forEach((entries, password) => {
    if (entries.length > 1) {
      entries.forEach(entry => {
        reusedEntries.push(entry);
      });
    }
  });

  return reusedEntries;
};

// Function to find weak passwords
const findWeakPasswords = () => {
  return passwordEntries.filter(entry => isWeakPassword(entry.password));
};

// Function to find sites where passkeys are available (simplified for demo)
const findPasskeysAvailable = () => {
  // In a real app, this would check against a database of sites supporting passkeys
  // For demo, we'll return a subset of entries
  return passwordEntries.filter((_, index) => index % 3 === 0);
};

// Function to find sites where 2FA is available but not set up (simplified for demo)
const findTwoFactorAvailable = () => {
  // In a real app, this would check against a database of sites supporting 2FA
  // For demo, we'll return a subset of entries
  return passwordEntries.filter((_, index) => index % 2 === 0);
};

// Calculate security score based on password health
export const calculateSecurityScore = () => {
  const reusedPasswords = findReusedPasswords();
  const weakPasswords = findWeakPasswords();
  const passkeysAvailable = findPasskeysAvailable();
  const twoFactorAvailable = findTwoFactorAvailable();

  // Calculate score (simplified for demo)
  // In a real app, this would use a more sophisticated algorithm
  const totalEntries = passwordEntries.length;
  const uniquePasswords = totalEntries - reusedPasswords.length;
  const strongPasswords = totalEntries - weakPasswords.length;

  // Base score calculation
  const baseScore = 1000;
  const uniquePasswordsBonus = (uniquePasswords / totalEntries) * 100;
  const strongPasswordsBonus = (strongPasswords / totalEntries) * 100;

  // Calculate final score
  const score = Math.round(baseScore + uniquePasswordsBonus + strongPasswordsBonus);

  // Calculate strength percentage
  const strengthPercentage = Math.round(
    ((uniquePasswordsBonus + strongPasswordsBonus) / 200) * 100
  );

  // Determine rating
  let rating = "POOR";
  if (strengthPercentage >= 80) {
    rating = "FANTASTIC";
  } else if (strengthPercentage >= 60) {
    rating = "GOOD";
  } else if (strengthPercentage >= 40) {
    rating = "FAIR";
  }

  return {
    score,
    rating,
    strengthPercentage,
    securityIssues: {
      reusedPasswords: {
        count: reusedPasswords.length,
        description: "Reusing the same password on multiple sites puts you at risk if any one of those sites is breached.",
        items: reusedPasswords
      },
      weakPasswords: {
        count: weakPasswords.length,
        description: "Weak passwords can be easily guessed or cracked by attackers. Consider strengthening these passwords.",
        items: weakPasswords
      },
      passkeysAvailable: {
        count: passkeysAvailable.length,
        description: "Passkeys provide stronger security than passwords. These sites support passkeys but you haven't set them up yet.",
        items: passkeysAvailable
      },
      twoFactorAuthentication: {
        count: twoFactorAvailable.length,
        description: "Two-factor authentication adds an extra layer of security. These sites support 2FA but you haven't enabled it yet.",
        items: twoFactorAvailable
      }
    }
  };
};
