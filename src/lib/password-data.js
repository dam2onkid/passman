import { 
  Command, 
  Star, 
  List, 
  GalleryVerticalEnd,
  AudioWaveform 
} from "lucide-react";

// Mock data for password entries
export const passwordEntries = [
  {
    id: "1",
    icon: Command,
    name: "Alchemy",
    username: "grammin1604@gmail.com",
    password: "••••••••••",
    website: "https://auth.alchemy.com",
    savedOn: "AUTH.ALCHEMY.COM",
    firstName: "Nam",
    lastName: "Nguyen",
    lastEdited: {
      date: new Date("2023-03-24T20:09:29"),
      formattedString: "Friday, March 24, 2023 at 8:09:29 PM"
    },
    category: "A",
    isFavorite: false
  },
  {
    id: "2",
    icon: AudioWaveform,
    name: "Apple",
    username: "albertnam15@gmail.com",
    password: "••••••••••",
    website: "https://apple.com",
    savedOn: "APPLE.COM",
    firstName: "Albert",
    lastName: "Nam",
    lastEdited: {
      date: new Date("2023-02-15T14:30:00"),
      formattedString: "Wednesday, February 15, 2023 at 2:30:00 PM"
    },
    category: "A",
    isFavorite: true
  },
  {
    id: "3",
    icon: GalleryVerticalEnd,
    name: "apple tsa",
    username: "albertnam15@gmail.com",
    password: "••••••••••",
    website: "https://tsa.apple.com",
    savedOn: "TSA.APPLE.COM",
    firstName: "Albert",
    lastName: "Nam",
    lastEdited: {
      date: new Date("2023-01-10T09:15:00"),
      formattedString: "Tuesday, January 10, 2023 at 9:15:00 AM"
    },
    category: "A",
    isFavorite: false
  },
  {
    id: "4",
    icon: Command,
    name: "Apple Gotham",
    username: "albertnam15@gmail.com",
    password: "••••••••••",
    website: "https://gotham.apple.com",
    savedOn: "GOTHAM.APPLE.COM",
    firstName: "Albert",
    lastName: "Nam",
    lastEdited: {
      date: new Date("2023-03-05T16:45:00"),
      formattedString: "Sunday, March 5, 2023 at 4:45:00 PM"
    },
    category: "A",
    isFavorite: false
  },
  {
    id: "5",
    icon: Star,
    name: "Aptos hold",
    username: "",
    password: "••••••••••",
    website: "",
    savedOn: "LOCAL",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-02-20T11:20:00"),
      formattedString: "Monday, February 20, 2023 at 11:20:00 AM"
    },
    category: "A",
    isFavorite: false
  },
  {
    id: "6",
    icon: Star,
    name: "Aptos Wallet",
    username: "",
    password: "••••••••••",
    website: "",
    savedOn: "LOCAL",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-03-15T13:10:00"),
      formattedString: "Wednesday, March 15, 2023 at 1:10:00 PM"
    },
    category: "A",
    isFavorite: false
  },
  {
    id: "7",
    icon: Command,
    name: "Atlassian",
    username: "Signs in with Google",
    password: "••••••••••",
    website: "https://atlassian.com",
    savedOn: "ATLASSIAN.COM",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-02-28T17:25:00"),
      formattedString: "Tuesday, February 28, 2023 at 5:25:00 PM"
    },
    category: "A",
    isFavorite: false
  },
  {
    id: "8",
    icon: Star,
    name: "Babylon kelp",
    username: "",
    password: "••••••••••",
    website: "",
    savedOn: "LOCAL",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-01-25T10:05:00"),
      formattedString: "Wednesday, January 25, 2023 at 10:05:00 AM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "9",
    icon: Command,
    name: "Backpack wallet",
    username: "",
    password: "••••••••••",
    website: "",
    savedOn: "LOCAL",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-03-10T15:40:00"),
      formattedString: "Friday, March 10, 2023 at 3:40:00 PM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "10",
    icon: Command,
    name: "Base",
    username: "albertbase.com@gmail.com",
    password: "••••••••••",
    website: "https://base.org",
    savedOn: "BASE.ORG",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-02-05T12:50:00"),
      formattedString: "Sunday, February 5, 2023 at 12:50:00 PM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "11",
    icon: Command,
    name: "Binance",
    username: "namnguyenminh04@gmail.com",
    password: "••••••••••",
    website: "https://binance.com",
    savedOn: "BINANCE.COM",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-01-15T14:15:00"),
      formattedString: "Sunday, January 15, 2023 at 2:15:00 PM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "12",
    icon: Command,
    name: "Binance Gmail",
    username: "namnguyenminh04@gmail.com",
    password: "••••••••••",
    website: "https://gmail.com",
    savedOn: "GMAIL.COM",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-03-20T09:30:00"),
      formattedString: "Monday, March 20, 2023 at 9:30:00 AM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "13",
    icon: Star,
    name: "BINANCE WALLET",
    username: "",
    password: "••••••••••",
    website: "",
    savedOn: "LOCAL",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-02-10T16:20:00"),
      formattedString: "Friday, February 10, 2023 at 4:20:00 PM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "14",
    icon: Command,
    name: "Blex",
    username: "1376450025",
    password: "••••••••••",
    website: "",
    savedOn: "LOCAL",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-01-30T11:45:00"),
      formattedString: "Monday, January 30, 2023 at 11:45:00 AM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "15",
    icon: Command,
    name: "bybit",
    username: "0971832330",
    password: "••••••••••",
    website: "https://bybit.com",
    savedOn: "BYBIT.COM",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-03-01T13:55:00"),
      formattedString: "Wednesday, March 1, 2023 at 1:55:00 PM"
    },
    category: "B",
    isFavorite: false
  },
  {
    id: "16",
    icon: Star,
    name: "Cardano wallet",
    username: "",
    password: "••••••••••",
    website: "",
    savedOn: "LOCAL",
    firstName: "",
    lastName: "",
    lastEdited: {
      date: new Date("2023-02-25T10:35:00"),
      formattedString: "Saturday, February 25, 2023 at 10:35:00 AM"
    },
    category: "C",
    isFavorite: false
  }
];

// Group password entries by category
export const groupPasswordEntriesByCategory = () => {
  const grouped = {};
  
  passwordEntries.forEach(entry => {
    if (!grouped[entry.category]) {
      grouped[entry.category] = [];
    }
    grouped[entry.category].push(entry);
  });
  
  return grouped;
};

// Get all categories
export const getAllCategories = () => {
  return [...new Set(passwordEntries.map(entry => entry.category))].sort();
};
