import React, { useState } from "react";
import styled from "styled-components";
import emailjs from "emailjs-com";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaFacebookF, FaInstagram, FaDiscord } from 'react-icons/fa';
import SEO from './SEO';
import Sponsorship from './Sponsorship';

const MySwal = withReactContent(Swal);

// TODO: paste the Discord server invite link here once the server is ready
const DISCORD_INVITE_URL = "";


const VolunteerForm = () => {
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    message: false,
  });

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    message: false,
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate on change if the field has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  // Handle field blur (when user leaves a field)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, value);
  };

  // Validate individual field
  const validateField = (name, value) => {
    let isValid = true;

    switch (name) {
      case 'firstName':
        isValid = value.trim() !== '';
        break;
      case 'lastName':
        isValid = value.trim() !== '';
        break;
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'message':
        isValid = value.trim() !== '';
        break;
      default:
        break;
    }

    setErrors({ ...errors, [name]: !isValid });
    return isValid;
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {
      firstName: formData.firstName.trim() === '',
      lastName: formData.lastName.trim() === '',
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      message: formData.message.trim() === '',
    };

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      message: true,
    });

    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const sendEmail = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      MySwal.fire({
        title: "<h2 style='color:#e74c3c;'>Validation Error</h2>",
        html: "<p style='color:#34495e; font-size:1.1rem;'>Please fill out all required fields correctly.</p>",
        icon: "error",
        background: "#fef2f2",
        confirmButtonColor: "#e74c3c",
        confirmButtonText: "<b>OK</b>",
      });
      return;
    }

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        formData,
        process.env.REACT_APP_EMAILJS_USER_KEY
      )
      .then(
        () => {
          MySwal.fire({
            title: "<h2 style='color:#27ae60;'>Success!</h2>",
            html: "<p style='color:#34495e; font-size:1.1rem;'>Your application has been submitted successfully.</p>",
            icon: "success",
            background: "#f3f4f6",
            confirmButtonColor: "#27ae60",
            confirmButtonText: "<b>OK</b>",
            timer: 3000,
            timerProgressBar: true,
          });

          // Reset form
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
                    message: "",
          });
          setErrors({
            firstName: false,
            lastName: false,
            email: false,
            message: false,
          });
          setTouched({
            firstName: false,
            lastName: false,
            email: false,
            message: false,
          });
        },
        () => {
          MySwal.fire({
            title: "<h2 style='color:#e74c3c;'>Error!</h2>",
            html: "<p style='color:#34495e; font-size:1.1rem;'>Failed to submit application. Please try again.</p>",
            icon: "error",
            background: "#fef2f2",
            confirmButtonColor: "#e74c3c",
            confirmButtonText: "<b>Try Again</b>",
          });
        }
      );
  };

  return (
    <PageContainer>
      <SEO
        title="Get Involved — Volunteer"
        description="Volunteer with Give Back Jojo to help prevent suicide and support mental health in your community. Join our Discord to learn about roles and how to get involved."
        path="/getinvolved"
      />
      {/* Header Image at the very top */}
      <HeaderImage />

      <ContentWrapper>
        {/* Jojo's Generosity sponsorship section — pulled up to overlap the header image */}
        <SponsorshipWrapper>
          <Sponsorship onStartToday={() => setShowForm(true)} />
        </SponsorshipWrapper>

        {/* Form Modal */}
        {showForm && (
          <ModalOverlay onClick={() => setShowForm(false)}>
            <FormContainer onClick={e => e.stopPropagation()}>
              <CloseButton onClick={() => setShowForm(false)} aria-label="Close">&times;</CloseButton>
              <Title>Get Involved</Title>
              <Description>
                Here's how you can make a difference.
              </Description>
              <SocialIconsContainer>
                <SocialIcon
                  href="https://www.facebook.com/profile.php?id=61564086892164"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </SocialIcon>
                <SocialIcon
                  href="https://www.instagram.com/givebackjojo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </SocialIcon>
              </SocialIconsContainer>
              <Form onSubmit={sendEmail}>
                <InputGroup>
                  <Label htmlFor="firstName" required>First Name</Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.firstName}
                    required
                  />
                  {errors.firstName && touched.firstName && (
                    <ErrorMessage>Please enter your first name</ErrorMessage>
                  )}
                </InputGroup>

                <InputGroup>
                  <Label htmlFor="lastName" required>Last Name</Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.lastName}
                    required
                  />
                  {errors.lastName && touched.lastName && (
                    <ErrorMessage>Please enter your last name</ErrorMessage>
                  )}
                </InputGroup>

                <InputGroup>
                  <Label htmlFor="email" required>Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                    required
                  />
                  {errors.email && touched.email && (
                    <ErrorMessage>Please enter a valid email address</ErrorMessage>
                  )}
                </InputGroup>

                <InputGroup>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number (optional)"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </InputGroup>

                <InputGroup>
                  <Label htmlFor="message" required>Your Message</Label>
                  <TextArea
                    id="message"
                    name="message"
                    placeholder="Tell us about your experience, skills, and why you're interested in volunteering with us"
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.message}
                    required
                  />
                  {errors.message && touched.message && (
                    <ErrorMessage>Please tell us about yourself</ErrorMessage>
                  )}
                </InputGroup>

                <Button type="submit">Send</Button>
              </Form>
            </FormContainer>
          </ModalOverlay>
        )}

        <BottomSection>
          <DiscordSection>
            <DiscordTitle>Join Our Discord</DiscordTitle>
            <DiscordText>
              Learn about our volunteer roles, how to get involved, and connect with the Give Back Jojo community.
            </DiscordText>
            <DiscordButton
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDiscord /> Join the Discord
            </DiscordButton>
          </DiscordSection>
        </BottomSection>
      </ContentWrapper>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  width: 100%;
`;

const HeaderImage = styled.div`
  background: url('https://static.wixstatic.com/media/08854068a2e04004a83a1b525ba62365.jpg/v1/crop/x_0,y_235,w_5472,h_1966/fill/w_980,h_352,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Flamingos%20and%20Macaroons.jpg') no-repeat center top/cover;
  height: 280px;
  width: 100%;
`;

const SponsorshipWrapper = styled.div`
  width: 90%;
  max-width: 1100px;
  margin-top: -80px;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: -40px;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fce4ec;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  /* Above StickyActionBar (1050) so the Donate/Shop pills don't cover the form,
     but below the Navbar (1200) */
  z-index: 1100;
  /* Keep the form clear of the fixed navbar (70px, 80px on mobile) */
  padding: calc(70px + 1.5rem) 1rem 1.5rem;

  @media (max-width: 768px) {
    padding: calc(80px + 1rem) 1rem 1rem;
  }
`;

const FormContainer = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 70px - 3rem);
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 1.5rem;
    max-height: calc(100vh - 80px - 2rem);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  &:hover { color: #000; }
`;

const BottomSection = styled.div`
  background-color: var(--secondary-color-dark);
  width: 100%;
  padding: 3rem 0;
  margin-top: 2rem;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 1rem;
  text-align: center;
`;

const Description = styled.p`
  color: var(--text-light);
  margin-bottom: 1.5rem;
  text-align: center;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  
  &:after {
    content: ${props => props.required ? "'*'" : "''"};
    color: var(--error-color);
    margin-left: 0.25rem;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.error ? 'var(--error-color)' : 'var(--border-color)'};
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.error ? 'var(--error-color)' : 'var(--primary-color)'};
    box-shadow: 0 0 0 3px ${props => props.error ? 'rgba(220, 38, 38, 0.2)' : 'rgba(254, 165, 0, 0.3)'};
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${props => props.error ? 'var(--error-color)' : 'var(--border-color)'};
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.error ? 'var(--error-color)' : 'var(--primary-color)'};
    box-shadow: 0 0 0 3px ${props => props.error ? 'rgba(220, 38, 38, 0.2)' : 'rgba(254, 165, 0, 0.3)'};
  }
`;

const ErrorMessage = styled.span`
  color: var(--error-color);
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const Button = styled.button`
  background-color: var(--secondary-color);
  color: white;
  padding: 0.75rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  font-weight: 600;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: var(--secondary-color-dark);
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const DiscordSection = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
`;

const DiscordTitle = styled.h2`
  font-size: 2rem;
  color: white;
  margin-bottom: 1rem;
`;

const DiscordText = styled.p`
  color: white;
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
`;

const DiscordButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background-color: #5865f2;
  color: white;
  padding: 0.85rem 1.75rem;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.3s ease;

  svg {
    font-size: 1.4rem;
  }

  &:hover {
    background-color: #4752c4;
  }
`;

const SocialIconsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SocialIcon = styled.a`
  color: var(--text-color);
  font-size: 1.5rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--primary-color);
  }
`;


export default VolunteerForm;