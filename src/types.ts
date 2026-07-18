
export interface ChatMessage {
  sender: 'user' | 'host';
  text: string;
  timestamp: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'owner' | 'company';
  avatar: string;
  password?: string;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  type: 'House' | 'Apartment' | 'Room' | 'Office';
  beds: number;
  baths: number;
  sqft: number;
  locationName: string;
  region?: 'Dhanmondi' | 'Bashundhara' | 'Uttara' | 'Mirpur' | 'Gulshan' | 'Banani';
  rating?: number;
  reviewsCount?: number;
  description: string;
  imageColor: string;
  x: number;
  y: number;
  amenities: string[];
  host: {
    name: string;
    avatar: string;
    responseRate?: string;
    responseTime?: string;
    phone?: string;
    rating?: number;
  };
  isApproved: boolean;
  isFeatured?: boolean;
}

export type Language = 'EN' | 'BN';

export interface SystemLog {
  id: string;
  time: string;
  message: string;
  level: 'SUCCESS' | 'INFO' | 'WARN' | 'ERROR';
}
