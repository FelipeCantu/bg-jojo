import React from "react";
import styled from "styled-components";
import Carousel from './Carousel';
import SEO from './SEO';

const AboutSection = () => {
  return (
    <SectionContainer>
      <SEO
        title="About Us"
        description="Give Back Jojo is a non-profit providing free therapy for ages 12+, art therapy, group therapy, and mental health resources to prevent suicide."
        path="/about"
      />
      <HeroSection>
        <BackgroundVideo autoPlay loop muted playsInline disablePictureInPicture controlsList='nodownload nofullscreen noremoteplayback'>
          <source src={require('../assets/flamingos.mp4')} type='video/mp4' />
          Your browser does not support the video tag.
        </BackgroundVideo>
        <Title>ABOUT US</Title>
      </HeroSection>
      
      <ContentContainer>
        <ContentWrapper>
          <TextContent>
            <Divider />
            <Subtitle>Supporting Mental Health and Suicide Prevention</Subtitle>
            <Description>
              <AboutContainer>
                <Paragraph>
                  Give Back JoJo is a non-profit organization providing free access to therapy for ages 12 and up. On the
                  <ReportLink 
                    href="https://ibis.utah.gov/ibisph-view/indicator/complete_profile/SuicDth.html#:~:text=From%202021%20to%202023%2C%20the,696%20suicide%20deaths%20in%202023." 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Complete Health Indicator Report of Suicide
                  </ReportLink>, the Utah Department of Health & Human Services states:
                </Paragraph>
                <Paragraph>
                  "Utah high school students reported … 41.5% felt sad or hopeless, 22.5% seriously considered attempting
                  suicide, 18% made a suicide plan, 9% attempted suicide one or more times, and 2.7% had a suicide attempt
                  that required medical attention… From 2020 to 2022, the age-adjusted suicide rate in Utah was 20.85 per
                  100,000 persons, with an average of 670 suicides per year. There were 717 suicide deaths in 2022."
                </Paragraph>
                <Paragraph>
                  These alarming statistics underscore the urgent need for accessible mental health services, and Give Back
                  JoJo can help with that! We provide free access to art therapy, group therapy, meditation spaces, books
                  to read, food, and karaoke—creating a sense of community. Give Back JoJo is a safe space for anyone
                  who needs an escape to vent, create, and express themselves freely.
                </Paragraph>
                <Paragraph>
                  Our mascot, the flamingo bird, represents the heart chakra. The pink color of flamingos symbolizes
                  emotional healing and releasing negative emotions. It is also Joseph's favorite bird! Their bucket
                  hat and swag reflect our brother's legacy.
                </Paragraph>
              </AboutContainer>
            </Description>
          </TextContent>
          <ImageContainer>
            <StyledImage src="https://static.wixstatic.com/media/nsplsh_4539616574426532773430~mv2_d_4752_3168_s_4_2.jpg/v1/fill/w_319,h_319,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image%20by%20Sam%20Schooler.jpg" alt="Clouds and Sun" />
          </ImageContainer>
        </ContentWrapper>
      </ContentContainer>
      <CarouselTitle>Get to Know Us</CarouselTitle>
      <Carousel />
    </SectionContainer>
  );
};

const SectionContainer = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
`;

const HeroSection = styled.div`
  position: relative;
  width: 100%;
  height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BackgroundVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  pointer-events: none;
  user-select: none;
`;

const Title = styled.h2`
  font-size: 3rem;
  font-weight: bold;
  color: var(--primary-color);
  text-transform: uppercase;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 2rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 80rem;
  width: 100%;
  padding: 3rem 3rem 0 3rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1.5rem 1.5rem 0 1.5rem;
  }

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const CarouselTitle = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  color: var(--text-color);
  margin: 3rem 0 1rem;
  text-align: center;
  width: 100%;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin: 2rem 0 1rem;
  }
`;

const TextContent = styled.div`
  flex: 2;
  padding-right: 2rem;
  
  @media (max-width: 768px) {
    width: 100%;
    padding-right: 0;
  }
`;

const Divider = styled.hr`
  width: 10%;
  margin-left: 0;
  border: solid black 3px;
  margin-bottom: 25px;
`;

const Subtitle = styled.h3`
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Description = styled.div`
  color: var(--text-light);
  font-size: 1.1rem;
  line-height: 1.5;
`;

const AboutContainer = styled.div`
  padding: 2rem;
  color: var(--text-color);
  max-width: 800px;
  margin: 0 auto;
  font-family: var(--font-body);
  
  @media (max-width: 768px) {
    padding: 1rem;
    max-width: 100%;
  }
`;

const Paragraph = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  margin: 1rem 0;
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-top: -15vh; /* Pulls image up to overlap video */
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-top: 2rem;
    align-items: center;
  }
`;

const StyledImage = styled.img`
  width: 100%;
  max-width: 600px;
  height: auto;
  border-radius: 0.5rem;
  border: 4px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  @media (min-width: 1024px) {
    max-width: 700px;
  }
`;

const ReportLink = styled.a`
  color: var(--info-color);
  text-decoration: none; 
  transition: all 0.3s ease;
  margin: 0 0.25rem;
  position: relative; 
  
  &:hover {
    color: var(--info-color);
    
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      bottom: -2px;
      left: 0;
      background-color: var(--info-color); 
      transform: none; 
      opacity: 1; 
    }
  }
`;

export default AboutSection;