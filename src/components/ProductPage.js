import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import sanityClient from '../sanityClient';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { useCart } from '../CartContext';
import { ShoppingBagIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import LoadingContainer from './LoadingContainer';

// Styled Components
const Wrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #333;
  transition: color 0.2s ease;

  &:hover {
    color: #044947;
  }
`;

const ProductLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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
  gap: 0.8rem;
  overflow-x: auto;
  padding: 0.5rem 0;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }

  @media (min-width: 1024px) {
    flex-direction: column;
    overflow-x: visible;
    overflow-y: visible;
    max-height: none;
    padding-right: 1rem;
    flex-wrap: wrap;
    max-width: 80px;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const Thumbnail = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: ${({ $selected }) => ($selected ? '2px solid #333' : '1px solid #ddd')};
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }

  @media (min-width: 1024px) {
    width: 70px;
    height: 70px;
    margin-bottom: 0.8rem;
  }

  &:hover {
    border-color: #999;
  }
`;

const MainImageContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
  flex-grow: 1;
`;

const MainImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const ProductInfo = styled.div``;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #2a2a2a;
`;

const Price = styled.p`
  font-size: 1.75rem;
  color: #044947;
  font-weight: 700;
  margin-bottom: 1.5rem;
`;

const Description = styled.p`
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: #666;
`;

const MetaSection = styled.div`
  margin-bottom: 1.5rem;
`;

const MetaLabel = styled.p`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2a2a2a;
`;

const SizeOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SizeButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${({ $selected }) => ($selected ? '#044947' : '#fff')};
  color: ${({ $selected }) => ($selected ? 'white' : '#333')};
  border: 1px solid ${({ $selected }) => ($selected ? '#044947' : '#ddd')};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #044947;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #ddd;
  }
`;

const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const QuantityButton = styled.button`
  background-color: #f0f0f0;
  border: none;
  font-size: 1.2rem;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const QuantityInput = styled.input`
  width: 50px;
  height: 36px;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
`;

const AddToCartButton = styled(ActionButton)`
  background-color: #044947;
  color: white;

  &:hover {
    background-color: #033634;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ViewCartButton = styled(ActionButton)`
  background-color: #333;
  color: white;

  &:hover {
    background-color: #222;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CartBadge = styled.span`
  background-color: #ff5a5f;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 50%;
  padding: 0.2rem 0.5rem;
  margin-left: 0.3rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #ff0000;
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
      ...(isSizeRequired && { size: selectedSize }),
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
      <BackButton onClick={() => navigate(-1)}>
        <ChevronLeftIcon width={20} height={20} />
        Back to Products
      </BackButton>

      <ProductLayout>
        <GallerySection>
          <MainImageContainer>
            <Zoom>
              <MainImage 
                src={product.images[selectedImage]?.asset?.url || 'https://via.placeholder.com/600x600?text=Product+Image'} 
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
          <Title>{product.name}</Title>
          <Price>${product.price?.toFixed(2)}</Price>
          
          <Description>
            {product.description || 'No description available.'}
          </Description>

          <MetaSection>
            {product.material && (
              <>
                <MetaLabel>Material</MetaLabel>
                <p>{product.material}</p>
              </>
            )}
            {product.category && (
              <>
                <MetaLabel>Category</MetaLabel>
                <p>{product.category}</p>
              </>
            )}
          </MetaSection>

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
              –
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
              View Cart
              {totalItems > 0 && <CartBadge>{totalItems}</CartBadge>}
            </ViewCartButton>
          </ButtonGroup>
        </ProductInfo>
      </ProductLayout>
    </Wrapper>
  );
}