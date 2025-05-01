import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

function MissionSection() {
  return (
    <SectionWrapper>
      <TextContainer>
        <Content>
          <Divider />
          <h2>Our Mission</h2>
          <p>
            Give Back Jojo is dedicated to raising awareness about mental health and preventing suicide.
            We strive to provide support to those in need and create a sense of community. Our efforts
            are focused on educating the public and professionals on better ways to support individuals
            struggling with mental health issues.
          </p>
          <p>
            We believe that everyone deserves access to counseling and support. By organizing various
            activities and campaigns, we aim to promote mental wellness and provide essential resources
            to those in need. Our goal is to make a positive impact on individuals' lives and contribute
            to a healthier, more supportive society.
          </p>
          <MoreLink to='/About'>
            <Button>Learn More</Button>
          </MoreLink>
        </Content>
      </TextContainer>

      <VideoContainer>
        <VideoBackground 
          autoPlay 
          loop 
          muted 
          playsInline 
          disablePictureInPicture 
          controlsList='nodownload nofullscreen noremoteplayback'
        >
          <source src={require('../assets/flamingo.mp4')} type='video/mp4' alt='clouds' />
        </VideoBackground>
      </VideoContainer>
    </SectionWrapper>
  );
}

// Styled Components
const SectionWrapper = styled.section`
  display: flex;
  width: 100%;
  min-height: 100vh;

  @media (max-width: 1024px) {
    flex-direction: column;
    min-height: auto;
  }
`;

const TextContainer = styled.div`
  flex: 1;
  background: white;
  padding: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;

  @media (max-width: 1024px) {
    width: 100%;
    padding: 30px 20px;
    min-height: auto;
    order: 1;
  }

  @media (max-width: 768px) {
    padding: 25px 15px;
  }
`;

const Divider = styled.hr`
  width: 10%;
  margin-left: 0;
  border: solid black 3px;
  margin-bottom: 25px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
    border-width: 2px;
  }
`;

const Content = styled.div`
  max-width: 600px;
  text-align: left;
  
  h2 {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  p {
    font-size: 1.1rem;
    color: #333;
    margin-bottom: 20px;
    line-height: 1.6;
  }

  @media (max-width: 1024px) {
    h2 {
      font-size: 2.2rem;
    }
    
    p {
      font-size: 1rem;
    }
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 1.8rem;
      margin-bottom: 15px;
    }
    
    p {
      font-size: 0.95rem;
      margin-bottom: 15px;
      line-height: 1.5;
    }
  }
`;

const Button = styled.button`
  background-color: #1a120b;
  color: white;
  padding: 12px 20px;
  font-size: 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 150px;

  &:hover {
    background-color: white;
    color: black;
    border: black solid 2px;
  }

  @media (max-width: 1024px) {
    width: 100%;
    margin-top: 10px;
  }
`;

const MoreLink = styled(Link)`
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;

  @media (max-width: 1024px) {
    display: block;
    width: 100%;
  }
`;

const VideoContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  height: 100vh;

  @media (max-width: 1024px) {
    width: 100%;
    height: 40vh;
    order: 2;
  }
`;

const VideoBackground = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;

  @media (max-width: 1024px) {
    position: relative;
  }
`;

export default MissionSection;