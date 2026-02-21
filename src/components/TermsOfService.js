import React from 'react';
import styled from 'styled-components';
import SEO from './SEO';

const TermsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
  color: var(--text-color);
  font-family: var(--font-body);
`;

const LastUpdated = styled.p`
  color: var(--text-light);
  font-style: italic;
  margin-bottom: 2rem;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const Heading1 = styled.h1`
  font-size: 2.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
`;

const Heading2 = styled.h2`
  font-size: 1.8rem;
  color: var(--text-color);
  margin: 2rem 0 1rem;
`;

const Paragraph = styled.p`
  margin-bottom: 1rem;
`;

const List = styled.ul`
  margin: 1rem 0;
  padding-left: 1.5rem;
  list-style-type: none;

  li {
    margin-bottom: 0.8rem;
    position: relative;
    padding-left: 1.5rem;

    &:before {
      content: '•';
      position: absolute;
      left: 0;
      color: var(--info-color);
    }
  }
`;

const ExternalLink = styled.a`
  color: var(--info-color);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: var(--info-color);
    text-decoration: underline;
  }
`;

const TermsOfService = () => {
  return (
    <TermsContainer>
      <SEO
        title="Terms of Service"
        description="Read the Terms of Service for Give Back Jojo, a non-profit dedicated to mental health awareness and suicide prevention."
        path="/terms"
      />
      <Heading1>Terms of Service</Heading1>
      <LastUpdated>Last updated: February 21, 2026</LastUpdated>

      <Section>
        <Paragraph>
          Welcome to Give Back Jojo. By accessing or using our website at{' '}
          <ExternalLink href="https://givebackjojo.org" target="_blank" rel="noopener noreferrer">
            givebackjojo.org
          </ExternalLink>
          , you agree to be bound by these Terms of Service. Please read them carefully before using our services.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>1. Acceptance of Terms</Heading2>
        <Paragraph>
          By accessing and using this website, you accept and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our website or services.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>2. About Give Back Jojo</Heading2>
        <Paragraph>
          Give Back Jojo is a non-profit organization dedicated to mental health awareness and suicide prevention. We provide free access to therapy, art therapy, group therapy, and other mental health resources to individuals ages 12 and up.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>3. Use of Our Services</Heading2>
        <Paragraph>By using our website and services, you agree to:</Paragraph>
        <List>
          <li>Use our services only for lawful purposes and in a manner consistent with all applicable laws and regulations.</li>
          <li>Not use our website to harass, harm, or intimidate others.</li>
          <li>Not attempt to gain unauthorized access to any part of our website or systems.</li>
          <li>Not post or share content that is offensive, harmful, or inappropriate.</li>
          <li>Treat all community members with respect and dignity.</li>
        </List>
      </Section>

      <Section>
        <Heading2>4. User Accounts</Heading2>
        <Paragraph>
          If you create an account on our website, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>5. Donations</Heading2>
        <Paragraph>
          All donations made through our website are voluntary and non-refundable unless otherwise required by law. Give Back Jojo is a registered non-profit organization and donations may be tax-deductible. Please consult a tax professional for advice specific to your situation.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>6. Shop & Purchases</Heading2>
        <Paragraph>
          All purchases made through our online shop are final. 100% of proceeds go directly toward our mission of mental health awareness and suicide prevention. By making a purchase, you agree to our return and shipping policies as communicated at checkout.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>7. Mental Health Resources</Heading2>
        <Paragraph>
          The information and resources provided on this website are for general informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. If you or someone you know is in crisis, please contact emergency services or a crisis hotline immediately.
        </Paragraph>
        <List>
          <li>National Suicide Prevention Lifeline: 988</li>
          <li>Crisis Text Line: Text HOME to 741741</li>
          <li>Emergency Services: 911</li>
        </List>
      </Section>

      <Section>
        <Heading2>8. Intellectual Property</Heading2>
        <Paragraph>
          All content on this website, including text, graphics, logos, images, and software, is the property of Give Back Jojo and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>9. Limitation of Liability</Heading2>
        <Paragraph>
          Give Back Jojo shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website or services. Our total liability shall not exceed the amount paid by you, if any, for accessing our services.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>10. Changes to Terms</Heading2>
        <Paragraph>
          We reserve the right to update these Terms of Service at any time. We will notify users of any significant changes by updating the date at the top of this page. Your continued use of our website after any changes constitutes your acceptance of the new terms.
        </Paragraph>
      </Section>

      <Section>
        <Heading2>11. Contact Us</Heading2>
        <Paragraph>
          If you have any questions about these Terms of Service, please contact us:
        </Paragraph>
        <List>
          <li>
            By visiting:{' '}
            <ExternalLink href="https://givebackjojo.org/getinvolved" target="_blank" rel="noopener noreferrer">
              givebackjojo.org/getinvolved
            </ExternalLink>
          </li>
        </List>
      </Section>
    </TermsContainer>
  );
};

export default TermsOfService;
