import React from 'react';
import styled from 'styled-components';

const StickyActionBar = () => {
  return (
    <Bar aria-label="Quick actions">
      <Pill
        href="https://www.zeffy.com/en-US/donation-form/jojos-generosity"
        target="_blank"
        rel="noopener noreferrer"
        $tone="donate"
      >
        <IconCircle $tone="donate">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 20.5s-7.5-4.6-10-9.1C.4 8.1 1.7 4.5 5 3.6c2-.5 4 .3 5 2 1-1.7 3-2.5 5-2 3.3.9 4.6 4.5 3 7.8-2.5 4.5-10 9.1-10 9.1Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </IconCircle>
        <Label>Donate</Label>
      </Pill>

      <Pill
        href="https://www.zeffy.com/en-US/ticketing/give-back-swag"
        target="_blank"
        rel="noopener noreferrer"
        $tone="shop"
      >
        <IconCircle $tone="shop">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 8h12l-1 12.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </IconCircle>
        <Label>Shop</Label>
      </Pill>
    </Bar>
  );
};

const TONE = {
  donate: {
    bg: 'var(--accent-pink)',
    fg: '#7a1f3d',
  },
  shop: {
    bg: '#f0c869',
    fg: '#6b4a12',
  },
};

const Bar = styled.div`
  position: fixed;
  top: 86px;
  right: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
  z-index: 1050;

  @media (max-width: 768px) {
    top: 92px;
    right: 0.75rem;
    gap: 0.45rem;
  }
`;

const Label = styled.span`
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 0.78rem;
  color: var(--text-color, #2a2a2a);
  white-space: nowrap;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateX(4px);
  transition: max-width 0.25s ease, opacity 0.2s ease, transform 0.25s ease;

  @media (max-width: 768px) {
    font-size: 0.68rem;
    max-width: 70px;
    opacity: 1;
    transform: none;
  }
`;

const IconCircle = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ $tone }) => TONE[$tone].bg};
  color: ${({ $tone }) => TONE[$tone].fg};
  transition: transform 0.25s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const Pill = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.3rem;
  padding-right: 1rem;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-decoration: none;
  transition: box-shadow 0.25s ease, transform 0.25s ease;

  &:hover,
  &:focus-visible {
    transform: translateX(-2px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);

    ${IconCircle} {
      transform: scale(1.08);
    }

    ${Label} {
      max-width: 90px;
      opacity: 1;
      transform: none;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--text-color, #2a2a2a);
    outline-offset: 3px;
  }

  @media (max-width: 768px) {
    padding: 0.22rem;
    padding-right: 0.7rem;
    gap: 0.4rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);

    &:hover,
    &:focus-visible {
      transform: none;
    }

    &:active {
      transform: scale(0.96);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:focus-visible,
    &:active {
      transform: none;
    }
  }
`;

export default StickyActionBar;