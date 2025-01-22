import React from "react";
import styled from "styled-components";

const SectionContainer = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4rem 2rem;
  overflow: hidden;
`;

const BackgroundVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50vh;
  object-fit: cover;
  z-index: -1;
  pointer-events: none;
  user-select: none;
`;

const TitleContainer = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 2rem;
`;

const Title = styled.h2`
  font-size: 3rem;
  font-weight: bold;
  color: #d1b7a1;
  text-transform: uppercase;
`;

const ContentContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 6rem;  // Adjust this to position it lower if necessary
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 80rem;
  width: 100%;
  margin-top: 4rem;
  background-color: rgba(248, 241, 235, 0.9);
  padding: 3rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const TextContent = styled.div`
  flex: 2;
`;

const Subtitle = styled.h3`
  font-size: 1.75rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  color: #374151;
  font-size: 1.1rem;
  line-height: 1.5;
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledImage = styled.img`
  max-width: 90%;
  height: auto;
  border-radius: 0.5rem;
  border: 4px solid white;
`;

const AboutSection = () => {
  return (
    <SectionContainer>
      <BackgroundVideo autoPlay loop muted playsInline disablePictureInPicture controlsList='nodownload nofullscreen noremoteplayback'>
      <source src={require('../assets/flamingos.mp4')} type='video/mp4' alt='clouds' />
      Your browser does not support the video tag.
      </BackgroundVideo>
      <TitleContainer>
        <Title>ABOUT US</Title>
      </TitleContainer>
      <ContentContainer>
        <ContentWrapper>
          <TextContent>
            <Subtitle>Supporting Mental Health and Suicide Prevention</Subtitle>
            <Description>
              Cheryl and Delilah are sisters from Saratoga Springs, UT. They love gaming, art, and singing.
              <br /><br />
              Cheryl enjoys dancing with her rabbit. She likes music, spending time with loved ones, and eating good food.
              <br /><br />
              Delilah loves doodling and watching movies. She has three guinea pigs that she treats like her babies.
            </Description>
          </TextContent>
          <ImageContainer>
            <StyledImage src="https://static.wixstatic.com/media/nsplsh_4539616574426532773430~mv2_d_4752_3168_s_4_2.jpg/v1/fill/w_319,h_319,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image%20by%20Sam%20Schooler.jpg" alt="Clouds and Sun" />
          </ImageContainer>
        </ContentWrapper>
      </ContentContainer>
    </SectionContainer>
  );
};

export default AboutSection;
