import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import styled, { keyframes, css } from "styled-components";

// Styled components
const EmailVerificationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f7f9fc;
`;

const EmailVerificationCard = styled.div`
  width: 100%;
  max-width: 500px;
  padding: 2.5rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  text-align: center;

  @media (max-width: 640px) {
    padding: 1.5rem;
  }
`;

const VerificationIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #4f46e5;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
`;

const VerificationMessage = styled.p`
  color: #333;
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const VerificationInstructions = styled.p`
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const VerificationActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
`;

const ResendButton = styled.button`
  background-color: white;
  color: #4f46e5;
  border: 1px solid #4f46e5;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #f5f5ff;
  }

  &:disabled {
    color: #888;
    border-color: #ddd;
    cursor: not-allowed;
  }

  ${props => props.isResending && css`
    animation: ${pulse} 1.5s infinite;
  `}
`;

const ContinueButton = styled.button`
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #4338ca;
  }
`;

// Component implementation
const EmailVerification = () => {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { currentUser, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (isEmailVerified) {
      toast.success("Email verified successfully!");
      navigate("/profile");
    }

    // Start countdown for resend button
    let interval = null;
    if (countdown > 0 && !canResend) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    // Check verification status periodically
    const checkVerificationStatus = setInterval(() => {
      if (currentUser) {
        currentUser.reload().then(() => {
          if (currentUser.emailVerified) {
            toast.success("Email verified successfully!");
            navigate("/profile");
          }
        });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(checkVerificationStatus);
    };
  }, [currentUser, countdown, canResend, isEmailVerified, navigate]);

  const handleResendEmail = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email resent!");
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast.error("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <EmailVerificationContainer>
      <EmailVerificationCard>
        <VerificationIcon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10.5V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-3.5"></path>
            <path d="M22 10.5l-8.4 6.8c-.5.4-1.2.4-1.7 0L2 10.5"></path>
          </svg>
        </VerificationIcon>

        <Title>Verify Your Email</Title>
        
        <VerificationMessage>
          We've sent a verification email to:{" "}
          <strong>{currentUser?.email}</strong>
        </VerificationMessage>
        
        <VerificationInstructions>
          Please check your inbox and click the verification link to complete your registration.
          If you don't see the email, check your spam folder.
        </VerificationInstructions>

        <VerificationActions>
          <ResendButton
            onClick={handleResendEmail}
            disabled={!canResend || isResending}
            isResending={isResending}
          >
            {isResending 
              ? "Sending..." 
              : canResend 
                ? "Resend Verification Email" 
                : `Resend available in ${countdown}s`
            }
          </ResendButton>
          
          <ContinueButton onClick={() => navigate("/profile")}>
            Continue to Profile
          </ContinueButton>
        </VerificationActions>
      </EmailVerificationCard>
    </EmailVerificationContainer>
  );
};

export default EmailVerification;