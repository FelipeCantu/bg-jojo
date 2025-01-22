import React from "react";
import styled from "styled-components";

const Hotlines = () => {
  return (
    <>
      <VideoBackground>
        <video autoPlay loop muted playsInline disablePictureInPicture controlsList='nodownload nofullscreen noremoteplayback'>
        <source src={require('../assets/cloud.mp4')} type='video/mp4' alt='clouds' />
        Your browser does not support the video tag.
        </video>
      </VideoBackground>
      <Container>
        <Title>Hotlines</Title>
        <Description>Important contact numbers and support services.</Description>

        <HotlineContainer>
          <HotlineTitle>Suicide and Crisis Lifeline</HotlineTitle>
          <HotlineText>Call or text 988 to connect with mental health professionals. Veterans can press 1 after dialing 988 to reach the Veterans Crisis Lifeline.</HotlineText>
        </HotlineContainer>

        <HotlineContainer>
          <HotlineTitle>National Domestic Violence Hotline</HotlineTitle>
          <HotlineText>Call 1-800-799-7233</HotlineText>
        </HotlineContainer>

        <HotlineContainer>
          <HotlineTitle>Utah Domestic Violence Hotline</HotlineTitle>
          <HotlineText>Call 1-800-897-LINK (5465)</HotlineText>
        </HotlineContainer>

        <HotlineContainer>
          <HotlineTitle>Crisis Text Line</HotlineTitle>
          <HotlineText>Text HOME to 741741</HotlineText>
        </HotlineContainer>

        <HotlineContainer>
          <HotlineTitle>Utah Crisis Line</HotlineTitle>
          <HotlineText>Call (801) 587-3000 (local) or 1-800-273-8255</HotlineText>
        </HotlineContainer>
      </Container>
    </>
  );
};

export default Hotlines;

const Container = styled.div`
  background-color: #f3f4f6;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 32rem;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  color: #374151;
  margin-bottom: 1rem;
`;

const HotlineContainer = styled.div`
  margin-bottom: 1rem;
`;

const HotlineTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const HotlineText = styled.p`
  color: #374151;
  font-weight: bold;
`;

const VideoBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;