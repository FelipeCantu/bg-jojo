import React from "react";
import styled from "styled-components";

const TributeContainer = styled.div`
  text-align: center;
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const Description = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
`;

const ImageContainer = styled.div`
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-radius: 8px;
`;

const TributeImage = styled.img`
  width: 300px;
  height: auto;
  display: block;
  transition: all 0.3s ease-in-out;
  
  &:hover {
    filter: grayscale(50%) brightness(80%);
  }
`;

const Overlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;

  ${ImageContainer}:hover & {
    opacity: 1;
  }
`;

const Remembering = ({ name, imageUrl }) => {
  return (
    <TributeContainer>
      <Title>In Memory Of</Title>
      <Description>
        These individuals brought light into our lives and will always be remembered. We honor their memory and the impact they had on those around them.
      </Description>
      <ImageContainer>
        <TributeImage src={imageUrl} alt={name} />
        <Overlay>{name}</Overlay>
      </ImageContainer>
    </TributeContainer>
  );
};

export default Remembering;
