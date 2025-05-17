import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import sanityClient from '../sanityClient';
import { Link, useSearchParams } from 'react-router-dom';
import LoadingContainer from './LoadingContainer'; // Add this import

// Styled Components
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

const CategoryNav = styled.nav`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 3rem;
  padding: 0 1rem;
`;

const CategoryButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 24px;
  background: ${props => props.$active ? '#2a2a2a' : '#f5f5f5'};
  color: ${props => props.$active ? 'white' : '#333'};
  font-size: 0.95rem;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.$active ? '#2a2a2a' : '#e0e0e0'};
    transform: translateY(-1px);
  }
`;

const CountBadge = styled.span`
  background: ${props => props.$active ? 'rgba(255,255,255,0.2)' : '#ddd'};
  color: ${props => props.$active ? 'white' : '#666'};
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ActiveIndicator = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff5a5f;
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial category from URL
  const initialCategory = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Define categories (should match your Sanity schema)
  const categories = [
    { title: 'All', value: null },
    { title: 'T-Shirts', value: 't-shirt' },
    { title: 'Hoodies', value: 'hoodie' },
    { title: 'Sweaters', value: 'sweater' },
    { title: 'Stickers', value: 'sticker' },
    { title: 'Plushies', value: 'plushie' }
  ];

  // Fetch product counts for each category
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts = await sanityClient.fetch(`
          {
            "all": count(*[_type == "product"]),
            "t-shirt": count(*[_type == "product" && category == "t-shirt"]),
            "hoodie": count(*[_type == "product" && category == "hoodie"]),
            "sweater": count(*[_type == "product" && category == "sweater"]),
            "sticker": count(*[_type == "product" && category == "sticker"]),
            "plushie": count(*[_type == "product" && category == "plushie"])
          }
        `);
        setCategoryCounts(counts);
      } catch (error) {
        console.error('Error fetching category counts:', error);
      }
    };

    fetchCounts();
  }, []);

  // Fetch products based on active category
  useEffect(() => {
    const query = activeCategory 
      ? `*[_type == "product" && category == $activeCategory]{
          name,
          slug,
          price,
          category,
          "imageUrl": images[0].asset->url
        }`
      : `*[_type == "product"]{
          name,
          slug,
          price,
          category,
          "imageUrl": images[0].asset->url
        }`;

    sanityClient.fetch(query, { activeCategory })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        setLoading(false);
      });
  }, [activeCategory]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    // Update URL without page reload
    if (category) {
      searchParams.set('category', category);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <LoadingContainer 
        message="Loading products..." 
        spinnerColor="#fea500"
        textColor="#666"
        size="large"
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Giveback Swag</Title>
        <Subtitle>100% of proceeds goes towards our cause</Subtitle>
      </PageHeader>

      <CategoryNav>
        {categories.map((category) => {
          const count = category.value ? categoryCounts[category.value] : categoryCounts.all;
          const isActive = activeCategory === category.value;
          
          return (
            <CategoryButton
              key={category.value || 'all'}
              $active={isActive}
              onClick={() => handleCategoryChange(category.value)}
            >
              {category.title}
              {count !== undefined && (
                <CountBadge $active={isActive}>
                  {count}
                </CountBadge>
              )}
              {isActive && <ActiveIndicator />}
            </CategoryButton>
          );
        })}
      </CategoryNav>
      
      <Grid>
        {products.length > 0 ? (
          products.map((product) => (
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
              </Info>
            </Card>
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
            No products found in this category
          </div>
        )}
      </Grid>
    </PageContainer>
  );
}