import React from 'react';
import styled from 'styled-components';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import Mission from './Mission';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <MainSection>
      <VideoWrapper>
        <VideoBackground autoPlay loop muted playsInline disablePictureInPicture controlsList='nodownload nofullscreen noremoteplayback'>
          <source src={require('../assets/cloud.mp4')} type='video/mp4' alt='clouds' />
          Your browser does not support the video tag.
        </VideoBackground>
        <Content>
          <h1>Reach Out For Help</h1>
          <p>You Are Not Alone</p>
          <HotLink to='/Hotlines'>
            <Button>
              <p>Hotlines</p>
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
  min-height: 100vh;
  margin-bottom: 0;
  padding-bottom: 0;
  gap: 0;
`;

const VideoWrapper = styled.div`
  height: 90vh;
   @media (max-width: 768px) {
    height: 60vh;
  }
`;

const VideoBackground = styled.video`
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

const Content = styled.div`
  position: relative;
  color: pink;
  padding: 20px;
  font-size: 2rem;
  text-align: center;
  margin: 0 auto;
  width: 70%;

  h1 {
    font-size: 5em;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
    width: 90%;
    
    h1 {
      font-size: 2.5em;
    }
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 25px;
  border: 1px solid #004d40;
  background-color: white;
  color: #004d40;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.3s ease-in-out;
  width: 150px;
  margin: 0 auto; /* Centering the button */

  &:hover {
    background-color: #004d40;
    color: white;
  }

  p {
    margin: 0;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const HotLink = styled(Link)`
  text-decoration: none;
  display: flex;
  justify-content: center;
`;

export default Home;
