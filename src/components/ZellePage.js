import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import SEO from './SEO';
import zelleQR from '../assets/zelle-qr.png';

const ZellePage = () => (
    <BackgroundWrapper>
        <SEO
            title="Donate via Zelle"
            description="Send your donation directly to Give Back Jojo via Zelle — no transaction fees."
            path="/zelle"
        />
        <Container>
            <Title>Donate with Zelle®</Title>
            <Subtitle>100% of your gift goes directly to Give Back Jojo — no fees.</Subtitle>
            <Card>
                <ZelleLabel>Send Money with Zelle®</ZelleLabel>
                <AccountName>GIVE BACK JOJO</AccountName>
                <QRImage src={zelleQR} alt="Zelle QR Code for Give Back Jojo" />
                <Note>Scan with your banking app to send your donation.</Note>
            </Card>
            <BackLink to="/supporting-givebackjojo">← Back to donation options</BackLink>
        </Container>
    </BackgroundWrapper>
);

const BackgroundWrapper = styled.div`
    background: #fcd3c1;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
`;

const Container = styled.div`
    background: #feedfd;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    padding: 2.5rem 2rem;
    max-width: 480px;
    width: 100%;
    text-align: center;

    @media (max-width: 768px) {
        border-radius: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
`;

const Title = styled.h1`
    font-size: 1.8rem;
    font-weight: 700;
    color: #cc4200;
    margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
    font-size: 1rem;
    color: #7a2600;
    margin-bottom: 2rem;
    line-height: 1.5;
`;

const Card = styled.div`
    padding: 2rem 1.5rem;
    background: #fff;
    border-radius: 12px;
    border: 2px solid #6d1ed4;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
`;

const ZelleLabel = styled.p`
    color: #6d1ed4;
    font-weight: 700;
    font-size: 1.1rem;
    margin: 0;
`;

const AccountName = styled.p`
    color: #333;
    font-weight: 600;
    font-size: 1rem;
    margin: 0;
`;

const QRImage = styled.img`
    width: 200px;
    height: 200px;
    object-fit: contain;
    margin: 0.5rem 0;
`;

const Note = styled.p`
    color: #666;
    font-size: 0.9rem;
    margin: 0;
`;

const BackLink = styled(Link)`
    font-size: 0.95rem;
    color: #054944;
    text-decoration: underline;
    font-weight: 500;

    &:hover {
        color: #cc4200;
    }
`;

export default ZellePage;
