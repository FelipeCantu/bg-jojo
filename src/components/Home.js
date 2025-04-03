import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import Mission from './Mission';
import { Link } from 'react-router-dom';
import LoadingContainer from './LoadingContainer'; // Import the Loading component

function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for demonstration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingContainer />;
  }

  return (
    <MainSection>
      <VideoWrapper>
        <VideoBackground autoPlay loop muted playsInline disablePictureInPicture controlsList='nodownload nofullscreen noremoteplayback'>
          <source src={require('../assets/cloud.mp4')} type='video/mp4' alt='clouds' />
          Your browser does not support the video tag.
        </VideoBackground>
        <Content>
          <HeroHeading>Reach Out For Help</HeroHeading>
          <HeroSubtext>You Are Not Alone</HeroSubtext>
          <HotLink to='/Hotlines'>
            <Button>
              <ButtonText>Hotlines</ButtonText>
              <ChevronRightIcon width={20} height={20} />
            </Button>
          </HotLink>
        </Content>
      </VideoWrapper>
      <Mission />
    </MainSection>
  );
}

const MainSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 90vh;
  }
`;

const VideoBackground = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  margin: 0;
  padding: 0;
  z-index: -1;
`;

const Content = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 1200px;
  text-align: center;
  color: pink;
  padding: 0;
  margin: 0;
`;

const HeroHeading = styled.h1`
  font-size: clamp(3rem, 10vw, 6rem); /* Increased base size */
  margin: 0 0 1rem 0;
  line-height: 1.2;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
  
  @media (max-width: 480px) {
    font-size: clamp(3.5rem, 12vw, 4rem); /* Larger on very small screens */
    margin-bottom: 2.5rem;
  }
`;

const HeroSubtext = styled.p`
  font-size: clamp(1.5rem, 5vw, 2.5rem); /* Increased base size */
  margin: 0 0 2rem 0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  
  @media (max-width: 480px) {
    font-size: clamp(1.8rem, 6vw, 2.2rem); /* Larger on very small screens */
    margin-bottom: 2.5rem;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border: 1px solid #004d40;
  background-color: white;
  color: #004d40;
  border-radius: 4px;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-size: clamp(1rem, 2.5vw, 1.2rem); /* Slightly larger */
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  
  &:hover {
    background-color: #004d40;
    color: white;
    transform: translateY(-2px);
    box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 480px) {
    padding: 0.9rem 2rem;
    min-width: 160px;
  }
`;

const ButtonText = styled.p`
  margin: 0;
`;

const HotLink = styled(Link)`
  text-decoration: none;
  display: inline-flex;
  justify-content: center;
`;

export default Home;