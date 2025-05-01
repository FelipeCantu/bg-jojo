import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import sanityClient from '../sanityClient';
import { Link } from 'react-router-dom';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2.5rem;
  padding: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
  }
`;

const Card = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 280px;
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    height: 220px;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const Info = styled.div`
  padding: 1.5rem;
`;

const ProductName = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: #333;
  font-weight: 600;
`;

const Price = styled.p`
  font-size: 1.3rem;
  font-weight: 700;
  color: #2a2a2a;
  margin: 0 0 0.5rem 0;
`;

const Fit = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  text-transform: capitalize;
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #666;
`;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sanityClient.fetch(`*[_type == "product"]{
      name,
      slug,
      price,
      fit,
      "imageUrl": images[0].asset->url
    }`)
    .then(data => {
      setProducts(data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Loading>Loading products...</Loading>;
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Our Collection</Title>
        <Subtitle>Discover our premium selection of products</Subtitle>
      </PageHeader>
      
      <Grid>
        {products.map((product) => (
          <Card key={product.slug.current} to={`/products/${product.slug.current}`}>
            <ImageContainer>
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300?text=Product+Image';
                }}
              />
            </ImageContainer>
            <Info>
              <ProductName>{product.name}</ProductName>
              <Price>${product.price.toFixed(2)}</Price>
              {product.fit && <Fit>Fit: {product.fit}</Fit>}
            </Info>
          </Card>
        ))}
      </Grid>
    </PageContainer>
  );
}