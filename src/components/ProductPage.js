import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import sanityClient from '../sanityClient';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { ArrowTopRightOnSquareIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import LoadingContainer from './LoadingContainer';
import SEO from './SEO';
import { getProductSchema } from '../utils/structuredData';
import { DEFAULT_PLACEHOLDER_IMAGE, ZEFFY_SHOP_URL } from '../constants';

// Styled Components
const PageBackground = styled.div`
  background-color: #fce4ec;
  min-height: 100vh;
  width: 100%;
`;

const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;

  @media (max-width: 768px) {
    padding: 0 0 5rem;
    width: 100%;
    overflow-x: hidden;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.95rem;
  color: #666;
  transition: color 0.2s ease;

  &:hover {
    color: #044947;
  }

  @media (max-width: 768px) {
    margin: 0.75rem 1rem;
  }
`;

const ProductLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const GallerySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 1024px) {
    flex-direction: row-reverse;
  }
`;

const Thumbnails = styled.div`
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding: 0.25rem 0;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }

  @media (min-width: 1024px) {
    flex-direction: column;
    overflow-x: visible;
    overflow-y: visible;
    max-height: none;
    flex-wrap: wrap;
    max-width: 72px;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
`;

const Thumbnail = styled.img`
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid ${({ $selected }) => ($selected ? '#044947' : 'transparent')};
  transition: all 0.2s ease;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    border-radius: 8px;
  }

  &:hover {
    border-color: #044947;
    opacity: 0.85;
  }
`;

const MainImageContainer = styled.div`
  position: relative;
  flex-grow: 1;
  border-radius: 16px;
  overflow: hidden;
  background: #f5f5f5;

  @media (max-width: 768px) {
    border-radius: 0;
  }
`;

const MainImage = styled.img`
  width: 100%;
  max-height: 520px;
  object-fit: contain;

  @media (max-width: 768px) {
    max-height: 360px;
  }

  @media (max-width: 400px) {
    max-height: 280px;
  }
`;

const ProductInfo = styled.div`
  @media (max-width: 768px) {
    padding: 1rem 1rem 0;
  }
`;

const TitleText = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  color: #1a1a1a;
  font-weight: 700;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.35rem;
  }
`;

const PriceText = styled.p`
  font-size: 1.5rem;
  color: #044947;
  font-weight: 700;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
`;

const Description = styled.p`
  line-height: 1.7;
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.95rem;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 1rem;
    line-height: 1.6;
  }
`;

const MetaSection = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const MetaItem = styled.div``;

const MetaLabel = styled.p`
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #1a1a1a;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetaValue = styled.p`
  color: #666;
  font-size: 0.95rem;
  margin: 0;
  text-transform: capitalize;
`;

const SizeOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SizeTag = styled.span`
  padding: 0.5rem 1.25rem;
  background: #fff;
  color: #333;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  opacity: ${({ $outOfStock }) => ($outOfStock ? 0.4 : 1)};

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    min-width: 48px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.75rem 1rem;
    background: #fff;
    border-top: 1px solid #eee;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
    z-index: 200;
  }
`;

const BuyButton = styled.a`
  flex: 1;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  border-radius: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #044947;
  color: white;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: #033634;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(4, 73, 71, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.85rem 1rem;
    font-size: 0.95rem;
    border-radius: 8px;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  font-size: 1.1rem;
  color: #ff5a5f;
`;

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await sanityClient.fetch(
          `*[_type == "product" && slug.current == $slug][0]{
            _id,
            name,
            price,
            category,
            description,
            material,
            sizes,
            sizeOptions[]{
              size,
              stock
            },
            colors,
            images[]{asset->{url}}
          }`,
          { slug }
        );

        if (!data) {
          setError('Product not found');
        } else {
          setProduct(data);
        }
      } catch (err) {
        setError('Failed to fetch product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return <LoadingContainer
      message="Loading product details..."
      spinnerColor="#fea500"
      textColor="#555"
      size="large"
    />;
  }

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!product) return <ErrorMessage>Product not found</ErrorMessage>;

  const showSizes = product.category !== 'plushie' &&
    product.category !== 'sticker' &&
    (product.sizeOptions?.length > 0 || product.sizes?.length > 0);

  return (
    <PageBackground>
    <Wrapper>
      <SEO
        title={product.name}
        description={product.description || `${product.name} — Shop for a cause at Give Back Jojo`}
        path={`/products/${product.slug?.current || slug}`}
        image={product.images?.[0]?.asset?.url}
        jsonLd={getProductSchema({
          name: product.name,
          description: product.description || `${product.name} — Shop for a cause`,
          price: product.price,
          image: product.images?.[0]?.asset?.url,
          url: `https://givebackjojo.org/products/${product.slug?.current || slug}`,
        })}
      />
      <BackButton onClick={() => navigate(-1)}>
        <ChevronLeftIcon width={18} height={18} />
        Back to Products
      </BackButton>

      <ProductLayout>
        <GallerySection>
          <MainImageContainer>
            <Zoom>
              <MainImage
                src={product.images[selectedImage]?.asset?.url || DEFAULT_PLACEHOLDER_IMAGE}
                alt={product.name}
              />
            </Zoom>
          </MainImageContainer>

          {product.images?.length > 1 && (
            <Thumbnails>
              {product.images.map((image, index) => (
                <Thumbnail
                  key={index}
                  src={image.asset.url}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  $selected={index === selectedImage}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </Thumbnails>
          )}
        </GallerySection>

        <ProductInfo>
          <TitleText>{product.name}</TitleText>
          <PriceText>${product.price?.toFixed(2)}</PriceText>

          <Description>
            {product.description || 'No description available.'}
          </Description>

          {(product.material || product.category) && (
            <MetaSection>
              {product.material && (
                <MetaItem>
                  <MetaLabel>Material</MetaLabel>
                  <MetaValue>{product.material}</MetaValue>
                </MetaItem>
              )}
              {product.category && (
                <MetaItem>
                  <MetaLabel>Category</MetaLabel>
                  <MetaValue>{product.category}</MetaValue>
                </MetaItem>
              )}
            </MetaSection>
          )}

          {showSizes && (
            <div>
              <MetaLabel>Available Sizes</MetaLabel>
              <SizeOptions>
                {product.sizeOptions?.length > 0 ? (
                  product.sizeOptions.map((option, index) => (
                    <SizeTag key={index} $outOfStock={option.stock <= 0}>
                      {option.size} {option.stock <= 0 && '(Out of Stock)'}
                    </SizeTag>
                  ))
                ) : (
                  product.sizes?.map((size, index) => (
                    <SizeTag key={index}>{size}</SizeTag>
                  ))
                )}
              </SizeOptions>
            </div>
          )}

          <ButtonGroup>
            <BuyButton href={ZEFFY_SHOP_URL} target="_blank" rel="noopener noreferrer">
              Buy on Zeffy
              <ArrowTopRightOnSquareIcon width={18} height={18} />
            </BuyButton>
          </ButtonGroup>
        </ProductInfo>
      </ProductLayout>
    </Wrapper>
    </PageBackground>
  );
}
