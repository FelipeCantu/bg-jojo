import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Remembering = ({ name, imageUrl, slug }) => {
  return (
    <Link to={`/tribute/${slug}`}>
      <TributeContainer>
        <ImageContainer>
          <TributeImage
            src={imageUrl} // Use the passed image URL
            alt={name}
          />
          <Overlay>
            <h3>{name}</h3>
          </Overlay>
        </ImageContainer>
      </TributeContainer>
    </Link>
  );
};

// Styled Components
const TributeContainer = styled.div`
  text-align: center;
  padding: 20px;
  cursor: pointer;

  @media (max-width: 768px) {
    padding: 20px 0;
    width: 100%;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-radius: 8px;
`;

const TributeImage = styled.img`
  width: 100%;
  max-width: 300px;
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

  &:hover {
    opacity: 1;
  }

  h3 {
    margin: 0;
    font-size: 20px;
  }
`;

export default Remembering;
