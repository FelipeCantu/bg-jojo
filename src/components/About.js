import React from "react";
import styled from "styled-components";
import Carousel from './Carousel'

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
            <Divider />
            <Subtitle>Supporting Mental Health and Suicide Prevention</Subtitle>
            <Description>
              <AboutContainer>
                <Paragraph>
                  Give Back JoJo is a non-profit organization providing free access to therapy for ages 12 and up. On the
                  Complete Health Indicator Report of Suicide, the Utah Department of Health & Human Services states:
                </Paragraph>
                <Paragraph>
                  “Utah high school students reported … 41.5% felt sad or hopeless, 22.5% seriously considered attempting
                  suicide, 18% made a suicide plan, 9% attempted suicide one or more times, and 2.7% had a suicide attempt
                  that required medical attention… From 2020 to 2022, the age-adjusted suicide rate in Utah was 20.85 per
                  100,000 persons, with an average of 670 suicides per year. There were 717 suicide deaths in 2022.”
                </Paragraph>
                <Paragraph>
                  These alarming statistics underscore the urgent need for accessible mental health services, and Give Back
                  JoJo can help with that! We provide free access to art therapy, group therapy, meditation spaces, books
                  to read, food, and karaoke—creating a sense of community. Give Back JoJo is a safe space for anyone
                  who needs an escape to vent, create, and express themselves freely.
                </Paragraph>
                <Paragraph>
                  Our mascot, the flamingo bird, represents the heart chakra. The pink color of flamingos symbolizes
                  emotional healing and releasing negative emotions. It is also Joseph’s favorite bird! Their bucket
                  hat and swag reflect our brother’s legacy.
                </Paragraph>
              </AboutContainer>
            </Description>
          </TextContent>
          <ImageContainer>
            <StyledImage src="https://static.wixstatic.com/media/nsplsh_4539616574426532773430~mv2_d_4752_3168_s_4_2.jpg/v1/fill/w_319,h_319,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image%20by%20Sam%20Schooler.jpg" alt="Clouds and Sun" />
          </ImageContainer>
        </ContentWrapper>
      </ContentContainer>
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
  margin-top: 0;
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
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 80rem;
  width: 100%;
  height: 100%;
  // margin-top: 2rem;
  // background-color: rgba(248, 241, 235, 0.9);
  padding: 3rem;
  border-radius: 0.5rem;
  // box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  @media (min-width: 768px) {
    flex-direction: row; /* Side-by-side layout on larger screens */
  }
`;

const TextContent = styled.div`
  flex: 2;
  margin-top: 15rem;
`;

const Divider = styled.hr`
  width: 10%;
  margin-left: 0;
  border: solid black 3px;
`


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

const AboutContainer = styled.div`
  padding: 2rem;
  // background-color: #f9f9f9;
  color: #333;
  // border-radius: 10px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
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
  align-items: center;
`;

const StyledImage = styled.img`
  width: 100%;
  max-width: 600px; /* Increased max size */
  height: auto;
  border-radius: 0.5rem;
  border: 4px solid white;

  @media (min-width: 1024px) {
    max-width: 700px; /* Even larger on bigger screens */
  }
`;



export default AboutSection;
