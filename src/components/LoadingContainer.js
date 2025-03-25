import React from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';
import logo from '../assets/hat.png';

const LoadingContainer = ({ 
  message = 'Loading...',
  spinnerColor = '#fea500',
  textColor = '#555',
  size = 'large' // Changed default to large
}) => {
  const sizes = {
    small: { spinner: 80, text: '1.5rem', logoSize: 40 }, // Increased all sizes
    medium: { spinner: 120, text: '1.8rem', logoSize: 60 },
    large: { spinner: 160, text: '2rem', logoSize: 80 }
  };

  return (
    <Container>
      <SpinnerWrapper $size={sizes[size].spinner}>
        <Spinner $color={spinnerColor} $size={sizes[size].spinner} />
        <LogoContainer $size={sizes[size].spinner}>
          <Logo 
            src={logo} 
            alt="Logo" 
            $size={sizes[size].logoSize}
          />
        </LogoContainer>
      </SpinnerWrapper>
      <LoadingMessage $color={textColor} $size={sizes[size].text}>
        {message}
      </LoadingMessage>
    </Container>
  );
};

// Prop type validation
LoadingContainer.propTypes = {
  message: PropTypes.string,
  spinnerColor: PropTypes.string,
  textColor: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

// Animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1.5rem;
`;

const SpinnerWrapper = styled.div`
  position: relative;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 8px solid rgba(243, 243, 243, 0.3); // Lighter track color
  border-top: 8px solid ${props => props.$color};
  border-radius: 50%;
  animation: ${spin} 1.2s linear infinite;
  box-sizing: border-box;
`;

const LogoContainer = styled.div`
  position: relative;
  width: ${props => props.$size * 0.5}px; // 50% of spinner size
  height: ${props => props.$size * 0.5}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.1));
`;

const LoadingMessage = styled.div`
  font-size: ${props => props.$size};
  color: ${props => props.$color};
  margin-top: 1.5rem;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

export default LoadingContainer;