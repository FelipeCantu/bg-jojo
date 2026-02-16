import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Give Back Jojo';
const SITE_URL = 'https://givebackjojo.org';
const DEFAULT_IMAGE = `${SITE_URL}/hatflamingo-512x512.png`;
const DEFAULT_DESCRIPTION =
  'Give Back Jojo is a non-profit dedicated to mental health awareness and suicide prevention, providing free therapy access, resources, and community support.';

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
  article,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article meta */}
      {article && article.publishedDate && (
        <meta property="article:published_time" content={article.publishedDate} />
      )}
      {article && article.author && (
        <meta property="article:author" content={article.author} />
      )}

      {/* Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
