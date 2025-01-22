import React from "react";
import styled from "styled-components";

const PageContainer = styled.div`
  background: url('https://static.wixstatic.com/media/08854068a2e04004a83a1b525ba62365.jpg/v1/crop/x_0,y_235,w_5472,h_1966/fill/w_980,h_352,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Flamingos%20and%20Macaroons.jpg') no-repeat center center/cover;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FormContainer = styled.div`
  background-color: rgba(243, 244, 246, 0.9);
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 40rem;
  margin: 2rem auto;
  position: relative;
  z-index: 1;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
  text-align: center;
`;

const Description = styled.p`
  color: #374151;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font-size: 1rem;
  resize: vertical;
`;

const Button = styled.button`
  background-color: #1d4ed8;
  color: white;
  padding: 0.75rem;
  font-size: 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  &:hover {
    background-color: #1e40af;
  }
`;

const VolunteerForm = () => {
  return (
    <PageContainer>
      <FormContainer>
        <Title>Volunteer</Title>
        <Description>Get in touch so we can start working together.</Description>
        <Form>
          <Input type="text" placeholder="First Name" required />
          <Input type="text" placeholder="Last Name" required />
          <Input type="email" placeholder="Email" required />
          <Input type="tel" placeholder="Phone" required />
          <TextArea placeholder="Message" rows="4" required></TextArea>
          <Button type="submit">Submit</Button>
        </Form>
      </FormContainer>
    </PageContainer>
  );
};

export default VolunteerForm;
