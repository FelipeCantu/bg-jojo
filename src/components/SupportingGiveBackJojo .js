import React from 'react';
import styled from 'styled-components';

const SupportingGiveBackJojo = () => {
    const venmoLink = 'https://account.venmo.com/u/DelilahJoy-Gallegos'; 
    const zelleLink = 'https://www.zellepay.com/yourPhoneNumberOrEmail';

    return (
        <BackgroundWrapper>
            <Wrapper>
                <Container>
                    <ContentWrapper>
                        <Image
                            src="https://static.wixstatic.com/media/bf5eb5d4973f47119364c3e64d067003.jpg/v1/fill/w_383,h_400,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/bf5eb5d4973f47119364c3e64d067003.jpg"
                            alt="Supporting Jojo"
                        />
                        <TextWrapper>
                            <Title>Supporting Give Back JoJo</Title>
                            <Subtitle>Make a Difference</Subtitle>
                            <Divider />
                            <Description>
                                As GoFundMe takes 3% +$.30 per donation, we decided that donations issued via cash, Zelle, Apple Cash, Venmo, etc., would be best.
                            </Description>
                            <PaymentOptions>
                                <StyledLink href={venmoLink} target="_blank" rel="noopener noreferrer">
                                    <PaymentOption>
                                        <PaymentTitle>Venmo</PaymentTitle>
                                    </PaymentOption>
                                </StyledLink>
                                <StyledLink href={zelleLink} target="_blank" rel="noopener noreferrer">
                                    <PaymentOption>
                                        <PaymentTitle>Zelle</PaymentTitle>
                                    </PaymentOption>
                                </StyledLink>
                            </PaymentOptions>
                        </TextWrapper>
                    </ContentWrapper>
                </Container>
            </Wrapper>
        </BackgroundWrapper>
    );
};

// Styled Components
const BackgroundWrapper = styled.div`
    background: #fcd3c1; /* Background color behind everything */
    min-height: 100vh; /* Ensures the background covers full screen */
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

const Container = styled.div`
    text-align: center;
    padding: 40px;
    background: #fb9e8a; /* Keeps content readable */
    border-radius: 10px;
    max-width: 60%;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    @media (max-width: 768px) {
        max-width: 100%;
        height: 100vh;
        border-radius: 0;
    }
`;

const Title = styled.h2`
    font-size: 28px;
    font-weight: normal;
    color: #cc4200;
    margin-bottom: 0px;
`;

const Subtitle = styled.h1`
    font-size: 50px;
    font-weight: normal;
    color: #cc4200;
    margin-top: 10px;
`;

const Divider = styled.div`
  width: 10%;
  height: 1px;
  background: black;
`;

const ContentWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 20px;
    }
`;

const Image = styled.img`
    max-width: 50%;
    height: auto;
    border-radius: 10px;

    @media (max-width: 768px) {
        max-width: 80%;
    }
`;

const TextWrapper = styled.div`
    text-align: left;
    max-width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%; 

    @media (max-width: 768px) {
        max-width: 100%;
    }
`;

const Description = styled.p`
    font-size: 16px;
    color: #cc4200;
    margin-top: 10px;
`;

const PaymentOptions = styled.div`
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 20px;
    width: 100%;
`;

const PaymentOption = styled.button`
  padding: 5px 20px;
  border: 1px solid #004d40;
  background-color: #004d40;
  color: white;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-size: 10px;
  font-weight: 100;
  font-family: 'Roboto', sans-serif;
  transition: background 0.3s ease-in-out, color 0.3s ease-in-out;
  width: 150px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: white;
    color: #004d40;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    width: 100%;
  }
`;

const PaymentTitle = styled.h4`
    font-size: 18px;
    font-weight: bold;
`;

const StyledLink = styled.a`
  text-decoration: none;
`;

export default SupportingGiveBackJojo;
