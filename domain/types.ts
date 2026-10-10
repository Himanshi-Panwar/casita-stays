// Date in YYYY-MM-DD format, handled as a UTC calendar day.
export type ISODate = string;
// Month in YYYY-MM format.
export type MonthKey = string;

export interface Host {
  name: string;
  avatarUrl: string;
  superhost: boolean;
  memberSince: number;
  responseRate: number;
  bio: string;
}

export interface Listing {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  amenities: string[];
  images: string[];
  host: Host;
}

export type ListingSummary = Pick<
  Listing,
  'id' | 'title' | 'city' | 'country' | 'pricePerNight' | 'rating' | 'reviewCount' | 'maxGuests'
> & { coverImage: string };

export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}

export type BookingStatus = 'confirmed';

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCity: string;
  listingImage: string;
  guestName: string;
  email: string;
  guests: number;
  checkIn: ISODate;
  checkOut: ISODate;
  price: PriceBreakdown;
  status: BookingStatus;
  createdAt: string;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc';

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Availability {
  listingId: string;
  month: MonthKey;
  bookedDates: ISODate[];
}
