import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import sanityClient from '../sanityClient';
import { Link, useSearchParams } from 'react-router-dom';
import LoadingContainer from './LoadingContainer';

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  min-height: 100vh;
  background: #fafafa;

  @media (max-width: 768px) {
    padding: 1.5rem 0;
    width: 100%;
    overflow-x: hidden;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 2.5rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  font-weight: 800;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  color: #888;
  font-size: 1.1rem;
  font-weight: 400;
`;

const CategoryNav = styled.nav`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 3rem;
  padding: 0 1rem;

  @media (max-width: 768px) {
    gap: 0.4rem;
    margin-bottom: 2rem;
    padding: 0 0.75rem;
  }
`;

const CategoryButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1.5px solid ${props => props.$active ? '#1a1a1a' : '#e0e0e0'};
  border-radius: 50px;
  background: ${props => props.$active ? '#1a1a1a' : '#fff'};
  color: ${props => props.$active ? 'white' : '#555'};
  font-size: 0.9rem;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: #1a1a1a;
    color: ${props => props.$active ? 'white' : '#1a1a1a'};
    transform: translateY(-1px);
  }
`;

const CountBadge = styled.span`
  background: ${props => props.$active ? 'rgba(255,255,255,0.2)' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#888'};
  padding: 0.1rem 0.45rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0 0.75rem;
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    padding: 0 0.75rem;
  }
`;

const Card = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 320px;
  overflow: hidden;
  position: relative;
  background: #f5f5f5;

  @media (max-width: 768px) {
    height: 200px;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${Card}:hover & {
    transform: scale(1.06);
  }
`;

const CategoryTag = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
`;

const Info = styled.div`
  padding: 1.25rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const ProductName = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 0.4rem 0;
  color: #1a1a1a;
  font-weight: 600;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const Price = styled.p`
  font-size: 1.2rem;
  font-weight: 700;
  color: #044947;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
  font-size: 1.1rem;
`;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const categories = [
    { title: 'All', value: null },
    { title: 'T-Shirts', value: 't-shirt' },
    { title: 'Hoodies', value: 'hoodie' },
    { title: 'Sweaters', value: 'sweater' },
    { title: 'Stickers', value: 'sticker' },
    { title: 'Plushies', value: 'plushie' }
  ];

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
                {product.category && (
                  <CategoryTag>{product.category}</CategoryTag>
                )}
              </ImageContainer>
              <Info>
                <ProductName>{product.name}</ProductName>
                <Price>${product.price.toFixed(2)}</Price>
              </Info>
            </Card>
          ))
        ) : (
          <EmptyState>No products found in this category</EmptyState>
        )}
      </Grid>
    </PageContainer>
  );
}
