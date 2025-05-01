import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import sanityClient from '../sanityClient';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { useCart } from '../CartContext';
import { ShoppingBagIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

const Wrapper = styled.div`
  max-width: 1200px;
  margin: auto;
  padding: 2rem;
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
    color: #4CAF50;
  }
`;

const FlexGallery = styled.div`
  display: flex;
  flex-direction: row;
  gap: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const GallerySection = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Thumbnails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  overflow-y: auto;
  max-height: 500px;

  @media (max-width: 768px) {
    flex-direction: row;
    max-height: none;
    max-width: 100%;
    overflow-x: auto;
    padding: 0.5rem 0;
    order: 2;
    margin-top: 1rem;
  }

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }
`;

const Thumbnail = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: ${({ selected }) => (selected ? '2px solid #333' : '1px solid #ddd')};
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }

  &:hover {
    border-color: #999;
  }
`;

const MainImageContainer = styled.div`
  line-height: 0;
  flex: 1;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
    order: 1;
  }
`;

const MainImage = styled.img`
  width: 100%;
  max-width: 500px;
  height: auto;
  max-height: 500px;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const Price = styled.p`
  font-size: 1.5rem;
  color: #4CAF50;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const Description = styled.p`
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const Label = styled.p`
  font-weight: bold;
  margin: 1rem 0 0.5rem;
`;

const SizeButton = styled.button`
  background: ${({ selected }) => (selected ? '#4CAF50' : '#f5f5f5')};
  color: ${({ selected }) => (selected ? 'white' : '#333')};
  border: 1px solid #ccc;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  margin-right: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ selected }) => (selected ? '#45a049' : '#eaeaea')};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const AddToCartButton = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #45a049;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ViewCartButton = styled.button`
  background-color: #333;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #222;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
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

const CartBadge = styled.span`
  background-color: #ff5a5f;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 50%;
  padding: 0.2rem 0.5rem;
  margin-left: 0.3rem;
`;

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleCart, items } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setLoading(true);
    sanityClient.fetch(`
      *[_type == "product" && slug.current == $slug][0]{
        _id,
        name,
        price,
        stripePriceId,
        stripePriceIds, // Object with size-specific price IDs
        description,
        material,
        fit,
        sizes,
        colors,
        images[]{asset->{url}}
      }
    `, { slug })
      .then(data => {
        if (data?.images?.length > 0) {
          setSelectedImage(data.images[0].asset.url);
        }
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [slug]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size before adding to cart.");
      return;
    }

    // Generate a unique ID for the cart item (combination of product ID and size)
    const itemId = `${product._id}-${selectedSize}`;
    
    // Get the appropriate Stripe price ID
    const stripePriceId = product.stripePriceIds?.[selectedSize] || product.stripePriceId;
    
    if (!stripePriceId) {
      alert("This product is not available for purchase at the moment. Please try again later.");
      console.error("Missing Stripe price ID for product:", product.name, "size:", selectedSize);
      return;
    }

    addToCart({
      id: itemId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      selectedSize: selectedSize,
      images: product.images,
      stripePriceId: stripePriceId, // This is crucial for Stripe checkout
      // Include any other necessary product data
      colors: product.colors,
      material: product.material,
      fit: product.fit
    });
  };

  if (loading) return <Wrapper><p>Loading...</p></Wrapper>;
  if (error) return <Wrapper><p>Something went wrong. Please try again later.</p></Wrapper>;
  if (!product) return <Wrapper><p>Product not found</p></Wrapper>;

  return (
    <Wrapper>
      <BackButton onClick={() => navigate(-1)}>
        <ChevronLeftIcon width={20} height={20} />
        Go Back
      </BackButton>
      <FlexGallery>
        <GallerySection>
          <Thumbnails>
            {product.images.map((image, index) => (
              <Thumbnail
                key={index}
                src={image.asset.url}
                alt={`Product Thumbnail ${index + 1}`}
                selected={image.asset.url === selectedImage}
                onClick={() => setSelectedImage(image.asset.url)}
              />
            ))}
          </Thumbnails>

          <MainImageContainer>
            <Zoom>
              <MainImage src={selectedImage} alt="Main Product" />
            </Zoom>
          </MainImageContainer>
        </GallerySection>

        <ProductInfo>
          <Title>{product.name}</Title>
          <Price>${product.price}</Price>
          <Description>{product.description}</Description>

          <Label>Select Size</Label>
          <div>
            {product.sizes.map((size, index) => (
              <SizeButton
                key={index}
                selected={selectedSize === size}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </SizeButton>
            ))}
          </div>

          <Label>Quantity</Label>
          <QuantitySelector>
            <QuantityButton onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>–</QuantityButton>
            <QuantityInput
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <QuantityButton onClick={() => setQuantity(prev => prev + 1)}>+</QuantityButton>
          </QuantitySelector>

          <ButtonGroup>
            <AddToCartButton onClick={handleAddToCart}>
              Add to Cart
            </AddToCartButton>
            <ViewCartButton onClick={toggleCart}>
              <ShoppingBagIcon width={18} height={18} />
              View Cart
              {totalItems > 0 && <CartBadge>{totalItems}</CartBadge>}
            </ViewCartButton>
          </ButtonGroup>
        </ProductInfo>
      </FlexGallery>
    </Wrapper>
  );
}