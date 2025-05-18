import { Lock, FileText, CreditCard } from "lucide-react";

const ITEM_TYPE = {
  LOGIN: "login",
  SECURE_NOTE: "secure_note",
  CRYPTO_WALLET: "crypto_wallet",
};

const ITEM_TYPE_DATA = {
  [ITEM_TYPE.LOGIN]: {
    type: ITEM_TYPE.LOGIN,
    icon: Lock,
    label: "Login",
    formFields: [
      {
        name: "itemName",
        label: "Item Name",
        type: "text",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
      },
      {
        name: "username",
        label: "Username",
        type: "text",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
      },
      {
        name: "website",
        label: "Website",
        type: "text",
      },
      {
        name: "firstName",
        label: "First Name",
        type: "text",
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
      },
      {
        name: "note",
        label: "Note",
        type: "textarea",
      },
    ],
  },
  [ITEM_TYPE.SECURE_NOTE]: {
    type: ITEM_TYPE.SECURE_NOTE,
    icon: FileText,
    label: "Secure Note",
    formFields: [
      {
        name: "itemName",
        label: "Item Name",
        type: "text",
      },
      {
        name: "note",
        label: "Note",
        type: "textarea",
      },
    ],
  },
  [ITEM_TYPE.CRYPTO_WALLET]: {
    type: ITEM_TYPE.CRYPTO_WALLET,
    icon: CreditCard,
    label: "Crypto Wallet",
    formFields: [
      {
        name: "itemName",
        label: "Item Name",
        type: "text",
      },
      {
        name: "recoveryPhrase",
        label: "Recovery Phrase",
        type: "text",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
      },
      {
        name: "walletAddress",
        label: "Wallet Address",
        type: "text",
      },
      {
        name: "note",
        label: "Note",
        type: "textarea",
      },
    ],
  },
};

export { ITEM_TYPE, ITEM_TYPE_DATA };
