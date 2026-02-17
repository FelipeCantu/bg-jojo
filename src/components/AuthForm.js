import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as authService from "../services/authService";
import toast from "react-hot-toast";
import { FaFacebook, FaGoogle, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import styled from "styled-components";

// Styled components
const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: ${({ $embedded }) => $embedded ? 'auto' : '100vh'};
  padding: ${({ $embedded }) => $embedded ? '0' : '2rem'};
  background-color: ${({ $embedded }) => $embedded ? 'transparent' : 'var(--background-alt)'};
`;

const AuthCard = styled.div`
  width: 100%;
  max-width: 480px;
  padding: 2.5rem;
  background-color: var(--background);
  border-radius: var(--border-radius);
  box-shadow: ${({ $embedded }) => $embedded ? 'none' : '0 8px 24px rgba(0, 0, 0, 0.08)'};

  @media (max-width: 640px) {
    padding: 1.5rem;
  }
`;

const AuthHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  font-family: var(--font-heading);
`;

const AuthTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
`;

const AuthSubtitle = styled.p`
  color: var(--text-light);
  font-size: 1rem;
`;

const AuthForm = styled.form`
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
`;

const InputIcon = styled.span`
  margin-right: 0.5rem;
  color: var(--text-light);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 2px rgba(254, 165, 0, 0.2);
  }
`;

const ForgotPassword = styled.div`
  text-align: right;
  margin-bottom: 1.5rem;
`;

const TextLink = styled.button`
  background: none;
  border: none;
  color: var(--secondary-color);
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.875rem;
  padding: 0;

  &:hover {
    color: var(--secondary-color-dark);
  }
`;

const AuthButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  border: none;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const EmailButton = styled(AuthButton)`
  background-color: var(--primary-color);
  color: white; /* Text on primary is usually white or dark depending on contrast */
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    background-color: var(--primary-color-hover);
  }
`;

const SocialAuthDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: var(--text-light);
  font-size: 0.875rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--border-color);
  }
`;

const DividerText = styled.span`
  padding: 0 1rem;
`;

const SocialAuthButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FacebookButton = styled(AuthButton)`
  background-color: #1877f2;
  color: white;

  &:hover:not(:disabled) {
    background-color: #166fe5;
  }
`;

const GoogleButton = styled(AuthButton)`
  background-color: white;
  color: var(--text-color);
  border: 1px solid var(--border-color);

  &:hover:not(:disabled) {
    background-color: #f8f9fa;
  }
`;

const SocialIcon = styled.span`
  margin-right: 0.5rem;
  font-size: 1.25rem;
`;

const AuthFooter = styled.div`
  text-align: center;
  color: var(--text-light);
  font-size: 0.875rem;
`;

const AuthErrorMessage = styled.div`
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  color: #b91c1c;
  font-size: 0.875rem;
`;

// Component implementation
const AuthFormComponent = ({ mode = "login", title, subtitle, redirectTo, embedded = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const { isAuthenticated } = useAuth();
  const [socialLoading, setSocialLoading] = useState({
    facebook: false,
    google: false
  });

  const navigate = useNavigate();

  // Determine redirect path
  const targetPath = redirectTo || "/profile";

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(targetPath);
    }
  }, [isAuthenticated, navigate, targetPath]);

  const validateForm = () => {
    // Reset previous errors
    setFormError(null);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address");
      return false;
    }

    // Password validation
    if (mode === "signup") {
      if (password.length < 8) {
        setFormError("Password must be at least 8 characters long");
        return false;
      }

      if (password !== confirmPassword) {
        setFormError("Passwords do not match");
        return false;
      }

      if (!displayName.trim()) {
        setFormError("Please enter your name");
        return false;
      }
    }

    return true;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let result;

      if (mode === "signup") {
        result = await authService.registerWithEmail(email, password, displayName);
        if (result.success) {
          toast.success("Account created! Please verify your email.");
          navigate("/email-verification");
        }
      } else {
        result = await authService.loginWithEmail(email, password);
        if (result.success) {
          toast.success("Login successful!");
          navigate(targetPath);
        }
      }

      if (!result.success) {
        handleAuthError(result);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    setSocialLoading({
      ...socialLoading,
      [provider]: true
    });

    try {
      let result;

      if (provider === "facebook") {
        result = await authService.signInWithFacebook();
      } else if (provider === "google") {
        result = await authService.signInWithGoogle();
      }

      if (result.success) {
        toast.success(`${result.isNewUser ? "Account created" : "Login successful"}!`);
        navigate(targetPath);
      } else {
        handleAuthError(result);
      }
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setSocialLoading({
        ...socialLoading,
        [provider]: false
      });
    }
  };

  const handleAuthError = (result) => {
    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      "auth/email-already-in-use": "This email is already registered. Please log in instead.",
      "auth/wrong-password": "Incorrect email or password. Please try again.",
      "auth/user-not-found": "No account found with this email. Please sign up.",
      "auth/too-many-requests": "Too many unsuccessful login attempts. Please try again later.",
      "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again.",
      "auth/account-exists-with-different-credential": "An account already exists with the same email address but different sign-in credentials. Try signing in using a different method."
    };

    const friendlyMessage = errorMessages[result.code] || result.error || "Authentication failed. Please try again.";
    setFormError(friendlyMessage);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setFormError("Please enter your email address to reset your password");
      return;
    }

    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        toast.success("Password reset email sent. Please check your inbox.");
      } else {
        setFormError(result.error || "Failed to send reset email. Please try again.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setFormError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <AuthContainer $embedded={embedded}>
      <AuthCard $embedded={embedded}>
        <AuthHeader>
          <AuthTitle>{title || (mode === "signup" ? "Create Account" : "Welcome Back")}</AuthTitle>
          <AuthSubtitle>
            {subtitle || (mode === "signup"
              ? "Join our community and start sharing your journey"
              : "Log in to access your account and content")}
          </AuthSubtitle>
        </AuthHeader>

        {formError && (
          <AuthErrorMessage>
            <p>{formError}</p>
          </AuthErrorMessage>
        )}

        <AuthForm onSubmit={handleEmailAuth}>
          {mode === "signup" && (
            <FormGroup>
              <FormLabel htmlFor="displayName">
                <InputIcon as={FaUser} />
                <span>Full Name</span>
              </FormLabel>
              <FormInput
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </FormGroup>
          )}

          <FormGroup>
            <FormLabel htmlFor="email">
              <InputIcon as={FaEnvelope} />
              <span>Email</span>
            </FormLabel>
            <FormInput
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="password">
              <InputIcon as={FaLock} />
              <span>Password</span>
            </FormLabel>
            <FormInput
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
              required
            />
          </FormGroup>

          {mode === "signup" && (
            <FormGroup>
              <FormLabel htmlFor="confirmPassword">
                <InputIcon as={FaLock} />
                <span>Confirm Password</span>
              </FormLabel>
              <FormInput
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </FormGroup>
          )}

          {mode === "login" && (
            <ForgotPassword>
              <TextLink
                type="button"
                onClick={handleResetPassword}
              >
                Forgot password?
              </TextLink>
            </ForgotPassword>
          )}

          <EmailButton
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : mode === "signup" ? "Create Account" : "Log In"}
          </EmailButton>
        </AuthForm>

        <SocialAuthDivider>
          <DividerText>or continue with</DividerText>
        </SocialAuthDivider>

        <SocialAuthButtons>
          <FacebookButton
            type="button"
            onClick={() => handleSocialAuth("facebook")}
            disabled={socialLoading.facebook}
          >
            <SocialIcon as={FaFacebook} />
            {socialLoading.facebook ? "Connecting..." : "Facebook"}
          </FacebookButton>

          <GoogleButton
            type="button"
            onClick={() => handleSocialAuth("google")}
            disabled={socialLoading.google}
          >
            <SocialIcon as={FaGoogle} />
            {socialLoading.google ? "Connecting..." : "Google"}
          </GoogleButton>
        </SocialAuthButtons>

        <AuthFooter>
          {mode === "signup" ? (
            <p>
              Already have an account?{" "}
              <Link to="/login" style={{ textDecoration: 'underline', color: 'var(--secondary-color)', fontWeight: '500' }}>
                Log In
              </Link>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <Link to="/signup" style={{ textDecoration: 'underline', color: 'var(--secondary-color)', fontWeight: '500' }}>
                Sign Up
              </Link>
            </p>
          )}
        </AuthFooter>
      </AuthCard>
    </AuthContainer>
  );
};

export default AuthFormComponent;