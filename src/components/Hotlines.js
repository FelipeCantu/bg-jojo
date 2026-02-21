import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import SEO from './SEO';

const Hotlines = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <PageContainer>
      <SEO
        title="Crisis Hotlines & Support"
        description="24/7 crisis support hotlines including 988 Suicide & Crisis Lifeline, Crisis Text Line, and Utah Crisis Line. You are not alone."
        path="/hotlines"
      />
      <VideoBackground>
        <video ref={videoRef} autoPlay loop muted playsInline disablePictureInPicture controlsList='nodownload nofullscreen noremoteplayback'>
        <source src={require('../assets/cloud.mp4')} type='video/mp4' />
        Your browser does not support the video tag.
        </video>
      </VideoBackground>
      <Container>
        <Title>Hotlines</Title>
        <Description>Important contact numbers and support services.</Description>

        <HotlineContainer>
          <HotlineTitle>Suicide and Crisis Lifeline</HotlineTitle>
          <HotlineText>
            Call or text <ClickableLink href="tel:988">988</ClickableLink> to connect with mental health professionals. 
            Veterans can press 1 after dialing 988 to reach the Veterans Crisis Lifeline. Press 2 for Spanish.
          </HotlineText>
        </HotlineContainer>

        <HotlineContainer>
          <HotlineTitle>Crisis Text Line</HotlineTitle>
          <HotlineText>
            Text HELLO to <ClickableLink href="sms:741741">741741</ClickableLink>
          </HotlineText>
        </HotlineContainer>

        <HotlineContainer>
          <HotlineTitle>National Domestic Violence Hotline</HotlineTitle>
          <HotlineText>
            Text "START" to <ClickableLink href="sms:88788">88788</ClickableLink> or call{' '}
            <ClickableLink href="tel:18007997233">1-800-799-7233</ClickableLink> for support, resources, 
            and hope for anyone affected by domestic violence / relationship abuse in the U.S.
          </HotlineText>
        </HotlineContainer>

        <HotlineContainer>
          <HotlineTitle>Utah Crisis Line</HotlineTitle>
          <HotlineText>
            Callers receive specialized support from certified crisis workers and are connected to mental health resources.{' '}
            <ClickableLink href="tel:8015873000">(801) 587-3000</ClickableLink>
          </HotlineText>
        </HotlineContainer>
      </Container>
    </PageContainer>
  );
};

export default Hotlines;

const PageContainer = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4rem 2rem;
  overflow: hidden;
`;

const Container = styled.div`
  background-color: rgba(243, 244, 246, 0.9);
  padding: 0rem 1.5rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 32rem;
  margin: 6rem auto;
  position: relative;
  z-index: 1;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-top: 1rem;
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
  height: 100vh;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;

    &::-webkit-media-controls {
      display: none !important;
    }
    &::-webkit-media-controls-panel {
      display: none !important;
    }
    &::-webkit-media-controls-enclosure {
      display: none !important;
    }
    &::-webkit-media-controls-play-button {
      display: none !important;
      opacity: 0 !important;
    }
    &::-webkit-media-controls-start-playback-button {
      display: none !important;
      opacity: 0 !important;
    }
    &::-webkit-media-controls-overlay-play-button {
      display: none !important;
      opacity: 0 !important;
    }
  }
`;

const ClickableLink = styled.a`
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    color: #1d4ed8;
  }
`;