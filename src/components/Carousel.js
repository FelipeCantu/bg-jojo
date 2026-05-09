import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import styled from "styled-components";
import sanityClient from "../sanityClient"; // Adjust path based on your setup
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
};

const CarouselComponent = () => {
  const [carouselItems, setCarouselItems] = useState([]);

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "carousel"] | order(_createdAt asc) {
          image{asset->{url}},
          text
        }`
      )
      .then((data) => {
        setCarouselItems(data.map((item) => ({
          image: item.image.asset.url,
          text: item.text,
        })));
      })
      .catch(console.error);
  }, []);
  
  return (
    <CarouselWrapper>
      <StyledSlider {...settings}>
        {carouselItems.map((item, index) => (
          <CarouselItem key={index}>
            <ImageWrapper>
              <CarouselImage src={item.image} alt={`carousel image ${index + 1}`} />
              <Text>{item.text}</Text>
            </ImageWrapper>
          </CarouselItem>
        ))}
      </StyledSlider>
    </CarouselWrapper>
  );
};

const CarouselWrapper = styled.div`
  width: 100%;
  padding: 2rem;
//   background-color: #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
`;


const StyledSlider = styled(Slider)`
  width: 80%;
  max-width: 1200px;

  .slick-list {
    overflow: visible;
    padding-bottom: 1rem;
  }

  /* Dots */
  .slick-dots li button::before {
    font-size: 10px;
    color: #f48fb1;
    opacity: 0.5;
  }

  .slick-dots li.slick-active button::before {
    color: #e91e8c;
    opacity: 1;
  }

  /* Arrow buttons */
  .slick-prev,
  .slick-next {
    background-color: #f48fb1;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    z-index: 1;
    box-shadow: 0 2px 8px rgba(233, 30, 140, 0.3);
    transition: background-color 0.2s ease, transform 0.2s ease;
  }

  .slick-prev:hover,
  .slick-next:hover {
    background-color: #e91e8c;
    transform: scale(1.1);
  }

  .slick-prev {
    left: -52px;
  }

  .slick-next {
    right: -52px;
  }

  .slick-prev::before {
    content: '🌸';
    font-size: 22px;
  }

  .slick-next::before {
    content: '🌸';
    font-size: 22px;
  }
`;

const CarouselItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 80%;
  max-width: 600px;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
`;

const CarouselImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 0;
  border: 4px solid #f8bbd0;
  border-bottom: none;
  display: block;
`;

const Text = styled.div`
  color: #880e4f;
  font-size: 1.25rem;
  background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  padding: 0.6rem 1rem;
  border-radius: 0;
  border: 4px solid #f8bbd0;
  border-top: none;
  width: 100%;
  box-sizing: border-box;
  font-weight: 500;
  letter-spacing: 0.01em;
`;
export default CarouselComponent;
