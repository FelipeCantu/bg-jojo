import React, { createContext, useContext, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack>
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type} onClick={() => remove(t.id)}>
            <ToastIcon $type={t.type}>{ICONS[t.type]}</ToastIcon>
            <ToastMsg>{t.message}</ToastMsg>
            <CloseBtn>✕</CloseBtn>
          </Toast>
        ))}
      </ToastStack>
    </ToastContext.Provider>
  );
};

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const ToastStack = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 360px;
  width: calc(100vw - 3rem);
`;

const COLORS = {
  success: { bg: '#e8f5e9', border: '#a5d6a7', icon: '#2e7d32', text: '#1b5e20' },
  error:   { bg: '#fff0ee', border: '#ffb3a0', icon: '#cc4200', text: '#7a2600' },
  warning: { bg: '#fff8e1', border: '#ffe082', icon: '#f57f17', text: '#5d4037' },
  info:    { bg: '#e8f4f4', border: '#80cbc4', icon: '#054944', text: '#054944' },
};

const Toast = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: ${(p) => COLORS[p.$type]?.bg || COLORS.info.bg};
  border: 1.5px solid ${(p) => COLORS[p.$type]?.border || COLORS.info.border};
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  animation: ${slideIn} 0.25s ease-out;
  color: ${(p) => COLORS[p.$type]?.text || COLORS.info.text};
`;

const ToastIcon = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${(p) => COLORS[p.$type]?.icon || COLORS.info.icon};
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

const ToastMsg = styled.span`
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.45;
  font-weight: 500;
`;

const CloseBtn = styled.span`
  font-size: 0.75rem;
  opacity: 0.45;
  flex-shrink: 0;
  margin-top: 2px;

  &:hover {
    opacity: 0.9;
  }
`;
