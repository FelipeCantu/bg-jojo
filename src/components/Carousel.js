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

  .slick-prev,
  .slick-next {
    background-color: transparent;
    width: 50px; /* Arrow width */
    height: 50px; /* Arrow height */
    border-radius: 50%; /* Circular button for the arrow */
    z-index: 1;
  }

  .slick-prev::before,
  .slick-next::before {
    font-size: 30px; /* Larger size for arrows */
    color: white; /* White arrows */
    content: ''; /* Disable default arrow content */
  }

  .slick-prev {
    left: -50px; /* Adjust left position */
  }

  .slick-next {
    right: -50px; /* Adjust right position */
  }

  .slick-prev:hover,
  .slick-next:hover {
    background-color: transparent;
  }

  .slick-prev::before {
    content: '←'; /* Left arrow */
    font-size: 40px; /* Adjust arrow size */
    color: black; /* Arrow color */
  }

  .slick-next::before {
    content: '→'; /* Right arrow */
    font-size: 40px; /* Adjust arrow size */
    color: black; /* Arrow color */
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
  border: 4px solid rgba(255, 255, 255, 0.9);
  border-bottom: none;
  display: block;
`;

const Text = styled.div`
  color: #333;
  font-size: 1.25rem;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 0;
  border: 4px solid rgba(255, 255, 255, 0.9);
  border-top: none;
  width: 100%;
  box-sizing: border-box;
`;
export default CarouselComponent;
