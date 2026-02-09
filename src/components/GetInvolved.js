import React, { useState } from "react";
import styled from "styled-components";
import emailjs from "emailjs-com";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import CustomSelect from "./CustomSelect";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram } from '@fortawesome/free-brands-svg-icons';

const MySwal = withReactContent(Swal);


const VolunteerForm = () => {
  // Volunteer roles data
  const volunteerRoles = [
    {
      id: 1,
      title: "Therapist for group therapy",
      items: [
        "College students pursuing degrees in psychology, counseling, or social work who need hours for certification or graduation",
        "Facilitate discussions on coping strategies, emotional regulation, and mental wellness under supervision",
        "Ensure a safe, supportive, and confidential environment"
      ],
      commitment: "Committed to scheduled sessions weekly"
    },
    {
      id: 2,
      title: "Art therapy",
      items: [
        "Certified art therapists or skilled artists guiding participants in expressive art activities",
        "Use creative outlets to support emotional healing and stress relief",
        "Provide instructions for group sessions",
        "Encourage open expression in a judgment-free space"
      ],
      commitment: "Committed to scheduled sessions weekly"
    },
    {
      id: 3,
      title: "Aromatherapy",
      items: [
        "Educate participants on the benefits of essential oils",
        "Conduct workshops on stress relief, relaxation techniques, and mindfulness",
        "Ensure the safe use of essential oils"
      ],
      commitment: "Committed to scheduled sessions weekly"
    },
    {
      id: 4,
      title: "Event Support Volunteers",
      items: [
        "Assist in organizing and managing mental health awareness events",
        "Help with event setup, registration, logistics, and participant engagement",
        "Promote events through community outreach and social media",
        "Provide on-site support to ensure smooth execution"
      ],
      commitment: ""
    }
  ];

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
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
        "service_fyv9d18",
        "template_l6tqa0l",
        formData,
        "oauDokO6GGZB-3gT1"
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
            role: "",
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
      {/* Header Image at the very top */}
      <HeaderImage />

      <ContentWrapper>
        {/* Form Container positioned over the header image */}
        <FormContainer>
          <Title>Contact</Title>
          <Description>
            Get in touch so we can start working together.
          </Description>
          <SocialIconsContainer>
            <SocialIcon
              href="https://www.facebook.com/profile.php?id=61564086892164"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FontAwesomeIcon icon={faFacebookF} />
            </SocialIcon>
            <SocialIcon
              href="https://www.instagram.com/givebackjojo/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FontAwesomeIcon icon={faInstagram} />
            </SocialIcon>
          </SocialIconsContainer>
          <Form onSubmit={sendEmail}>
            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Email */}
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

            {/* Phone (optional) */}
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

            {/* Volunteer Role (optional) */}
            {/* Volunteer Role (optional) */}
            <InputGroup>
              <Label htmlFor="role">Preferred Volunteer Role</Label>
              <CustomSelect
                name="role"
                options={volunteerRoles}
                value={formData.role}
                onChange={handleChange}
              />
            </InputGroup>

            {/* Message */}
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

        <RolesTitle>Volunteer Roles</RolesTitle>

        <BottomSection>
          <RolesSection>
            <RolesGrid>
              {volunteerRoles.map(role => (
                <RoleCard key={role.id}>
                  <RoleNumber>{role.id}</RoleNumber>
                  <RoleTitle>{role.title}</RoleTitle>
                  <RoleList>
                    {role.items.map((item, index) => (
                      <RoleItem key={index}>{item}</RoleItem>
                    ))}
                  </RoleList>
                  {role.commitment && <Commitment>{role.commitment}</Commitment>}
                </RoleCard>
              ))}
            </RolesGrid>
          </RolesSection>
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
  height: 200px;
  width: 100%;
`;

const ContentWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
`;

const FormContainer = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
  margin: -50px auto 0;
  position: relative;
  z-index: 1;
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

const RolesSection = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const RolesTitle = styled.h2`
  font-size: 2rem;
  color: var(--text-color);
  margin-top: 4rem;
  text-align: center;

`;

const RolesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  padding: 0 1rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const RoleCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  position: relative;
  margin-top: 2rem;
  border: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const RoleNumber = styled.div`
  position: absolute;
  top: -2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 4rem;
  height: 4rem;
  background-color: #feedfd;
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const RoleTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-color);
  margin-top: 1rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const RoleList = styled.ul`
  margin-bottom: 0.5rem;
  padding-left: 1rem;
  flex-grow: 1;
`;

const RoleItem = styled.li`
  color: var(--text-color);
  margin-bottom: 0.75rem;
  line-height: 1.5;
  font-size: 0.95rem;
`;

const Commitment = styled.p`
  color: var(--secondary-color);
  font-weight: 600;
  margin-top: auto;
  padding-top: 1rem;
  text-align: center;
  font-style: italic;
  font-size: 0.9rem;
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