const SITE_URL = 'https://givebackjojo.org';

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'NGO',
  name: 'Give Back Jojo',
  url: SITE_URL,
  logo: `${SITE_URL}/hatflamingo-512x512.png`,
  description:
    'A non-profit dedicated to mental health awareness and suicide prevention, providing free therapy access, resources, and community support in Saratoga Springs, Utah.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Saratoga Springs',
    addressRegion: 'UT',
    addressCountry: 'US',
  },
  sameAs: [],
});

export const getArticleSchema = ({ title, description, image, author, publishedDate, url }) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  image: image || `${SITE_URL}/hatflamingo-512x512.png`,
  author: {
    '@type': 'Person',
    name: author || 'Anonymous',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Give Back Jojo',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/hatflamingo-512x512.png` },
  },
  datePublished: publishedDate,
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
});

export const getEventSchema = ({ title, description, image, date, venue, city, state }) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: title,
  description,
  image: image || `${SITE_URL}/hatflamingo-512x512.png`,
  startDate: date,
  location: {
    '@type': 'Place',
    name: venue || 'TBA',
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state,
      addressCountry: 'US',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: 'Give Back Jojo',
    url: SITE_URL,
  },
});

export const getProductSchema = ({ name, description, price, image, url }) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name,
  description,
  image: image || `${SITE_URL}/hatflamingo-512x512.png`,
  brand: { '@type': 'Organization', name: 'Give Back Jojo' },
  offers: {
    '@type': 'Offer',
    price: price?.toFixed(2),
    priceCurrency: 'USD',
    url,
    availability: 'https://schema.org/InStock',
  },
});
