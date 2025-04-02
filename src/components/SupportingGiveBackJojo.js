import React from 'react';
import styled from 'styled-components';

const SupportingGiveBackJojo = () => {
    const venmoLink = 'https://account.venmo.com/u/DelilahJoy-Gallegos'; 
    const zelleLink = 'https://www.zellepay.com/yourPhoneNumberOrEmail';

    return (
        <BackgroundWrapper>
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
        </BackgroundWrapper>
    );
};

// Styled Components
const BackgroundWrapper = styled.div`
    background: #fcd3c1;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;

    @media (min-width: 768px) {
        padding: 2rem;
    }
`;

const Container = styled.div`
    background: #fb9e8a;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 1200px;
    padding: 2rem;
    margin: 0 auto;

    @media (max-width: 768px) {
        padding: 1.5rem;
        border-radius: 0;
    }
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;

    @media (min-width: 992px) {
        flex-direction: row;
        align-items: center;
        gap: 3rem;
    }
`;

const Image = styled.img`
    width: 100%;
    max-width: 400px;
    height: auto;
    border-radius: 10px;
    object-fit: cover;

    @media (min-width: 992px) {
        width: 45%;
        max-width: 500px;
    }
`;

const TextWrapper = styled.div`
    width: 100%;
    text-align: center;

    @media (min-width: 992px) {
        width: 55%;
        text-align: left;
    }
`;

const Title = styled.h2`
    font-size: 1.75rem;
    font-weight: 600;
    color: #cc4200;
    margin-bottom: 0.5rem;

    @media (min-width: 768px) {
        font-size: 2rem;
    }
`;

const Subtitle = styled.h1`
    font-size: 2rem;
    font-weight: 600;
    color: #cc4200;
    margin-top: 0.5rem;
    margin-bottom: 1rem;

    @media (min-width: 768px) {
        font-size: 2.5rem;
    }
`;

const Divider = styled.div`
    width: 80px;
    height: 3px;
    background: #cc4200;
    margin: 1.5rem auto;

    @media (min-width: 992px) {
        margin: 1.5rem 0;
    }
`;

const Description = styled.p`
    font-size: 1rem;
    color: #cc4200;
    line-height: 1.5;
    margin-bottom: 2rem;

    @media (min-width: 768px) {
        font-size: 1.1rem;
    }
`;

const PaymentOptions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    margin-top: 1.5rem;

    @media (min-width: 480px) {
        flex-direction: row;
        justify-content: center;
    }

    @media (min-width: 992px) {
        justify-content: flex-start;
    }
`;

const PaymentOption = styled.button`
    padding: 0.75rem 1.5rem;
    border: 1px solid #004d40;
    background-color: #004d40;
    color: white;
    border-radius: 5px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;

    &:hover {
        background-color: white;
        color: #004d40;
    }

    @media (min-width: 480px) {
        width: auto;
        min-width: 150px;
    }
`;

const PaymentTitle = styled.h4`
    font-size: 1rem;
    font-weight: 600;
    margin: 0;

    @media (min-width: 768px) {
        font-size: 1.1rem;
    }
`;

const StyledLink = styled.a`
    text-decoration: none;
    color: inherit;
    width: 100%;

    @media (min-width: 480px) {
        width: auto;
    }
`;

export default SupportingGiveBackJojo;