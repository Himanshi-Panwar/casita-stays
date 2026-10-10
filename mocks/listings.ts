import type { Host, Listing } from '@/domain/types';
import { createRng, type Rng } from './random';

interface CityProfile {
  city: string;
  country: string;
  /** Typical nightly price band for the city, USD. */
  price: [number, number];
  neighbourhoods: string[];
}

const CITIES: CityProfile[] = [
  {
    city: 'London',
    country: 'United Kingdom',
    price: [90, 220],
    neighbourhoods: ['Stratford', 'Camden', 'Kingston', 'Wembley', 'Greenwich'],
  },
  {
    city: 'Manchester',
    country: 'United Kingdom',
    price: [65, 150],
    neighbourhoods: ['Fallowfield', 'Rusholme', 'City Centre', 'Oxford Road', 'Salford'],
  },
  {
    city: 'Birmingham',
    country: 'United Kingdom',
    price: [60, 140],
    neighbourhoods: ['Selly Oak', 'Edgbaston', 'Digbeth', 'Jewellery Quarter', 'Harborne'],
  },
  {
    city: 'Toronto',
    country: 'Canada',
    price: [75, 180],
    neighbourhoods: ['Downtown', 'North York', 'Scarborough', 'The Annex', 'Etobicoke'],
  },
  {
    city: 'Melbourne',
    country: 'Australia',
    price: [70, 170],
    neighbourhoods: ['Carlton', 'Parkville', 'Brunswick', 'Clayton', 'Southbank'],
  },
  {
    city: 'Sydney',
    country: 'Australia',
    price: [85, 200],
    neighbourhoods: ['Kensington', 'Newtown', 'Ultimo', 'Parramatta', 'Chatswood'],
  },
  {
    city: 'Dublin',
    country: 'Ireland',
    price: [80, 190],
    neighbourhoods: ['City Centre', 'Rathmines', 'Phibsborough', 'Drumcondra', 'Dublin 8'],
  },
  {
    city: 'Berlin',
    country: 'Germany',
    price: [55, 130],
    neighbourhoods: ['Mitte', 'Kreuzberg', 'Friedrichshain', 'Charlottenburg', 'Neukölln'],
  },
];

const ADJECTIVES = [
  'Bright',
  'Cosy',
  'Modern',
  'Charming',
  'Spacious',
  'Elegant',
  'Riverside',
  'Garden',
  'Central',
  'Sunny',
  'Renovated',
  'Peaceful',
];

const TYPES = ['Casita', 'Loft', 'Townhouse', 'Studio', 'Villa', 'Apartment', 'Bungalow'];
const AMENITIES = [
  'Wi-Fi',
  'Air conditioning',
  'Fully equipped kitchen',
  'Washer & dryer',
  'Private terrace',
  'Rooftop access',
  'Workspace',
  'Coffee machine',
  'Garden',
  'Free parking',
  'Smart TV',
  'Record player',
  'Outdoor shower',
  'Plunge pool',
  'Bicycles',
  'Self check-in',
  'Hair dryer',
  'Iron',
  'Heating',
  'Baby cot',
];
const FIRST_NAMES = [
  'Olivia',
  'James',
  'Amelia',
  'Oliver',
  'Sophie',
  'Daniel',
  'Isabella',
  'Henry',
  'Emily',
  'Lucas',
  'Mia',
  'Ethan',
  'Charlotte',
  'Noah',
  'Grace',
  'Leo',
  'Emma',
  'Alexander',
  'Ella',
  'Theo',
];
const LAST_INITIALS = [
  'A',
  'B',
  'C',
  'D',
  'F',
  'G',
  'H',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'R',
  'S',
  'T',
];

export const LISTING_COUNT = 240;

const imageUrl = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

function buildHost(rng: Rng, index: number): Host {
  const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_INITIALS)}.`;
  const superhost = rng.chance(0.4);
  return {
    name,
    avatarUrl: imageUrl(`host-${index}`, 160, 160),
    superhost,
    memberSince: rng.int(2014, 2024),
    responseRate: superhost ? rng.int(95, 100) : rng.int(78, 96),
    bio: `${name} loves sharing a few local favourites — bakeries, quiet viewpoints and the best late-night tacos or ramen nearby. Messages are answered within the hour.`,
  };
}

function buildListing(index: number): Listing {
  const rng = createRng(1000 + index);
  const profile = CITIES[index % CITIES.length] as CityProfile;
  const neighbourhood = rng.pick(profile.neighbourhoods);
  const type = rng.pick(TYPES);
  const bedrooms = rng.int(1, 5);
  const maxGuests = Math.max(1, Math.min(10, bedrooms * 2 - (rng.chance(0.3) ? 1 : 0)));
  const id = `casita-${String(index + 1).padStart(3, '0')}`;
  const [minPrice, maxPrice] = profile.price;
  const price =
    Math.round((minPrice + rng.next() ** 1.4 * (maxPrice - minPrice) + bedrooms * 6) / 5) * 5;

  return {
    id,
    title: `${rng.pick(ADJECTIVES)} ${type} in ${neighbourhood}`,
    city: profile.city,
    country: profile.country,
    pricePerNight: price,
    rating: Math.round((3.9 + rng.next() ** 0.6 * 1.1) * 10) / 10,
    reviewCount: rng.int(4, 480),
    maxGuests,
    bedrooms,
    bathrooms: Math.max(1, Math.ceil(bedrooms / 2)),
    description: [
      `This ${type.toLowerCase()} is located in ${neighbourhood}, ${profile.city}. It offers a comfortable stay with space for up to ${maxGuests} guests and ${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}.`,
      `The property is close to local restaurants, shops, and public transport. It includes essential amenities for a convenient stay, making it suitable for couples, families, or business travellers.`,
    ].join('\n\n'),
    amenities: rng.sample(AMENITIES, rng.int(8, 14)).sort(),
    images: Array.from({ length: rng.int(4, 6) }, (_, n) => imageUrl(`${id}-${n}`, 1200, 800)),
    host: buildHost(rng, index),
  };
}

/** Built once per server process; deterministic, so ids and prices are stable across restarts. */
export const LISTINGS: readonly Listing[] = Object.freeze(
  Array.from({ length: LISTING_COUNT }, (_, index) => buildListing(index)),
);

export const CITY_NAMES: readonly string[] = CITIES.map((c) => c.city);

const BY_ID: ReadonlyMap<string, Listing> = new Map(LISTINGS.map((l) => [l.id, l]));

export const listingsRepository = {
  all: (): readonly Listing[] => LISTINGS,
  findById: (id: string): Listing | undefined => BY_ID.get(id),
};
