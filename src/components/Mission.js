import React from 'react';
import styled from 'styled-components';

function MissionSection() {
  return (
    <SectionWrapper>
      <TextContainer>
        <Content>
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
          <Button>Learn More</Button>
        </Content>
      </TextContainer>

      <VideoContainer>
        <VideoBackground autoPlay loop muted>
        <source src={require('../assets/flamingo.mp4')} type='video/mp4' alt='clouds' />
        Your browser does not support the video tag.
        </VideoBackground>
      </VideoContainer>
    </SectionWrapper>
  );
}

// Styled Components
const SectionWrapper = styled.section`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;

  @media (max-width: 1024px) {
    flex-direction: column;
    height: auto;
  }
`;

const TextContainer = styled.div`
  flex: 1;
  background: white;
  padding: 50px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1024px) {
    width: 100%;
    padding: 40px 20px;
  }
`;

const Content = styled.div`
  max-width: 600px;
  text-align: left;

  h2 {
    font-size: 2.5rem;
    font-weight: bold;
    border-top: 3px solid black;
    padding-top: 10px;
    margin-bottom: 20px;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #333;
    margin-bottom: 20px;
  }
`;

const Button = styled.button`
  background-color: #1a120b;
  color: white;
  padding: 12px 20px;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: white;
    color: black;
    border: black solid 2px;
  }
`;

const VideoContainer = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
  z-index: -3;
  @media (max-width: 1024px) {
    width: 100%;
    height: auto;
  }
`;

const VideoBackground = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export default MissionSection;
