import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import sanityClient from '../sanityClient';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { useCart } from '../CartContext';
import { ShoppingBagIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import LoadingContainer from './LoadingContainer';
import SEO from './SEO';
import { getProductSchema } from '../utils/structuredData';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants';

// Styled Components
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

const SizeButton = styled.button`
  padding: 0.5rem 1.25rem;
  background: ${({ $selected }) => ($selected ? '#044947' : '#fff')};
  color: ${({ $selected }) => ($selected ? 'white' : '#333')};
  border: 1.5px solid ${({ $selected }) => ($selected ? '#044947' : '#ddd')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    border-color: #044947;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: #eee;
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    min-width: 48px;
  }
`;

const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 2rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  width: fit-content;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const QuantityButton = styled.button`
  background: #fff;
  border: none;
  font-size: 1.1rem;
  width: 44px;
  height: 44px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;

  &:hover {
    background: #f5f5f5;
  }

  &:active {
    background: #eee;
  }
`;

const QuantityInput = styled.input`
  width: 48px;
  height: 44px;
  text-align: center;
  border: none;
  border-left: 1.5px solid #e0e0e0;
  border-right: 1.5px solid #e0e0e0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  outline: none;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
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
    z-index: 50;
  }
`;

const AddToCartButton = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  background: #044947;
  color: white;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: #033634;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(4, 73, 71, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.85rem 1rem;
    font-size: 0.95rem;
    border-radius: 8px;
  }
`;

const ViewCartButton = styled.button`
  padding: 1rem 1.5rem;
  font-size: 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1.5px solid var(--primary-color);
  background: transparent;
  color: var(--primary-color);
  font-weight: 600;

  &:hover {
    background: var(--primary-color);
    color: white;
    transform: translateY(-1px);
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

const CartBadge = styled.span`
  background: #ff5a5f;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 50%;
  padding: 0.15rem 0.45rem;
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
  const { addToCart, toggleCart, items } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await sanityClient.fetch(
          `*[_type == "product" && slug.current == $slug][0]{
            _id,
            name,
            price,
            category,
            stripePriceId,
            stripePriceIds,
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
          if (data.category !== 'plushie' && data.category !== 'sticker') {
            if (data.sizeOptions?.length > 0) {
              const firstInStock = data.sizeOptions.find(opt => opt.stock > 0);
              if (firstInStock) setSelectedSize(firstInStock.size);
            } else if (data.sizes?.length > 0) {
              setSelectedSize(data.sizes[0]);
            }
          }
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

  const handleAddToCart = () => {
    const isSizeRequired = product.category !== 'plushie' && product.category !== 'sticker';

    if (isSizeRequired && !selectedSize) {
      alert("Please select a size before adding to cart.");
      return;
    }

    const itemId = isSizeRequired
      ? `${product._id}-${selectedSize}`
      : product._id;

    const stripePriceId = isSizeRequired
      ? product.stripePriceIds?.[selectedSize] || product.stripePriceId
      : product.stripePriceId;

    if (!stripePriceId) {
      alert("This product is not available for purchase at the moment. Please try again later.");
      console.error("Missing Stripe price ID for product:", product.name);
      return;
    }

    addToCart({
      id: itemId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      ...(isSizeRequired && { selectedSize }),
      image: product.images[0]?.asset?.url,
      stripePriceId: stripePriceId,
      colors: product.colors,
      material: product.material,
      category: product.category
    });
  };

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

  const showSizeSelector = product.category !== 'plushie' &&
    product.category !== 'sticker' &&
    (product.sizeOptions?.length > 0 || product.sizes?.length > 0);

  return (
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

          {showSizeSelector && (
            <div>
              <MetaLabel>Select Size</MetaLabel>
              <SizeOptions>
                {product.sizeOptions?.length > 0 ? (
                  product.sizeOptions.map((option, index) => (
                    <SizeButton
                      key={index}
                      $selected={selectedSize === option.size}
                      onClick={() => setSelectedSize(option.size)}
                      disabled={option.stock <= 0}
                    >
                      {option.size} {option.stock <= 0 && '(Out of Stock)'}
                    </SizeButton>
                  ))
                ) : (
                  product.sizes?.map((size, index) => (
                    <SizeButton
                      key={index}
                      $selected={selectedSize === size}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </SizeButton>
                  ))
                )}
              </SizeOptions>
            </div>
          )}

          <MetaLabel>Quantity</MetaLabel>
          <QuantitySelector>
            <QuantityButton
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              aria-label="Decrease quantity"
            >
              -
            </QuantityButton>
            <QuantityInput
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              aria-label="Quantity"
            />
            <QuantityButton
              onClick={() => setQuantity(prev => prev + 1)}
              aria-label="Increase quantity"
            >
              +
            </QuantityButton>
          </QuantitySelector>

          <ButtonGroup>
            <AddToCartButton
              onClick={handleAddToCart}
              disabled={
                showSizeSelector &&
                (!selectedSize ||
                  (product.sizeOptions?.length > 0 &&
                    product.sizeOptions.find(opt => opt.size === selectedSize)?.stock <= 0))
              }
            >
              Add to Cart
            </AddToCartButton>
            <ViewCartButton onClick={toggleCart}>
              <ShoppingBagIcon width={18} height={18} />
              Cart
              {totalItems > 0 && <CartBadge>{totalItems}</CartBadge>}
            </ViewCartButton>
          </ButtonGroup>
        </ProductInfo>
      </ProductLayout>
    </Wrapper>
  );
}
