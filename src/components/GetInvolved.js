import React, { useState } from "react";
import styled from "styled-components";
import emailjs from "emailjs-com";

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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .send(
        "service_fyv9d18", // Replace with your EmailJS Service ID
        "template_l6tqa0l", // Replace with your EmailJS Template ID
        formData,
        "oauDokO6GGZB-3gT1" // Replace with your EmailJS Public Key
      )
      .then(
        (result) => {
          alert("Message sent successfully!");
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            message: "",
          });
        },
        (error) => {
          alert("Failed to send message, please try again.");
        }
      );
  };

  return (
    <PageContainer>
      <FormContainer>
        <Title>Volunteer</Title>
        <Description>Get in touch so we can start working together.</Description>
        <Form onSubmit={sendEmail}>
          <Input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <TextArea
            name="message"
            placeholder="Message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            required
          />
          <Button type="submit">Submit</Button>
        </Form>
      </FormContainer>
    </PageContainer>
  );
};

export default VolunteerForm;
