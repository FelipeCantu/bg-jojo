import React, { useState } from "react";
import styled from "styled-components";

const EmailNotifications = () => {
  const [toggles, setToggles] = useState({});

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Container>
      <Title>Email Notification Settings</Title>
      
      <Section>
        <SectionContent>
          <Subtitle>Marketing Emails</Subtitle>
          <Option>You are not subscribed to marketing emails</Option>
        </SectionContent>
        <Button>Subscribe Now</Button>
      </Section>
      
      {[
        { title: "General", description: "Updates and reminders" },
        { title: "Inbox", description: "New messages" },
        { title: "Blog", description: "Posts or comments are liked" },
        { title: "Stores", description: "Abandoned Cart" },
        { title: "Bookings", description: "Reminders and updates" },
        { title: "Cashier & Merchant Settings", description: "Payment notifications" },
        { title: "Invoices", description: "Invoice issued" },
        { title: "Price Quotes", description: "Price quote is accepted" }
      ].map((item, index) => (
        <Section key={index}>
          <SectionContent>
            <Subtitle>{item.title}</Subtitle>
            <Option>{item.description}</Option>
          </SectionContent>
          <ToggleWrapper>
            <ToggleInput
              type="checkbox"
              checked={toggles[item.title] || false}
              onChange={() => handleToggle(item.title)}
            />
          </ToggleWrapper>
        </Section>
      ))}
    </Container>
  );
};


const Container = styled.div`
  max-width: 95%;
  margin: auto;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const Subtitle = styled.h3`
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 5px;
`;

const Option = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 10px;
`;

const Button = styled.button`
  background-color: #024a47;
  color: white;
  padding: 8px 12px;
  border: none;
  // border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background-color: #013634;
  }
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleInput = styled.input`
  appearance: none;
  width: 40px;
  height: 20px;
  background: #ddd;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  outline: none;
  transition: background 0.3s;

  &:checked {
    background: #024a47;
  }

  &::before {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    top: 1px;
    left: 2px;
    transition: transform 0.3s;
  }

  &:checked::before {
    transform: translateX(20px);
  }
`;

export default EmailNotifications;