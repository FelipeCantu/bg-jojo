import React from 'react';
import Slider from 'react-slick';
import styled from 'styled-components';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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

  .slick-prev,
  .slick-next {
    background-color: white; /* Black background for the arrows */
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
    background-color: white; /* Keep the same color on hover */
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

const CarouselImage = styled.img`
  width: 80%;
  max-width: 600px;
  height: auto;
  border-radius: 0.5rem;
  border: 4px solid #fff;
  margin-bottom: 1rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
`;

const Text = styled.div`
  color: #333;
  font-size: 1.25rem;
  background-color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  width: 80%;
  max-width: 600px;
  margin: 0 auto;
`;

const carouselItems = [
  {
    image: "https://static.wixstatic.com/media/1db9c9_fb823f3259474a15be2974e1218347ca~mv2.jpg/v1/fill/w_327,h_371,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_3810_Original_edited.jpg",
    text: "Cheryl and Delilah are sisters from Saratoga Springs, UT. They love gaming, art, and singing."
  },
  {
    image: "https://static.wixstatic.com/media/1db9c9_ac28fd7586fa445bb7abc887bb939f23~mv2.jpg/v1/fill/w_473,h_409,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/1db9c9_ac28fd7586fa445bb7abc887bb939f23~mv2.jpg",
    text: "Cheryl enjoys dancing with her rabbit. She likes music, spending time with loved ones, and eating good food."
  },
  {
    image: "https://static.wixstatic.com/media/1db9c9_fcf96e491db845ab90baabfd32b4eef3~mv2.jpg/v1/crop/x_0,y_0,w_1238,h_1582/fill/w_337,h_430,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/1db9c9_fcf96e491db845ab90baabfd32b4eef3~mv2.jpg",
    text: "Delilah loves doodling and watching movies. She has three guinea pigs and plays the violin.​"
  },
];

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
  return (
    <CarouselWrapper>
      <StyledSlider {...settings}>
        {carouselItems.map((item, index) => (
          <CarouselItem key={index}>
            <CarouselImage src={item.image} alt={`carousel image ${index + 1}`} />
            <Text>{item.text}</Text>
          </CarouselItem>
        ))}
      </StyledSlider>
    </CarouselWrapper>
  );
};

export default CarouselComponent;
