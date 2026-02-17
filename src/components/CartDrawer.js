import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ShoppingBagIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '../CartContext';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants';
import { useNavigate } from 'react-router-dom';

// Animations
const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const slideOut = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 999;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
  transition: opacity 0.3s ease;
`;

const Drawer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 420px;
  height: 100vh;
  background: #fff;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transform: translateX(${({ isOpen }) => (isOpen ? '0' : '100%')});
  animation: ${({ isOpen }) =>
    isOpen
      ? css`${slideIn} 0.3s ease forwards`
      : css`${slideOut} 0.3s ease forwards`};

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
`;

const HeaderTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
`;

const CartIconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const CartBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ff5a5f;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CloseBtn = styled.button`
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #eee;
    transform: rotate(90deg);
  }

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2;
  }
`;

const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 2px;
  }
`;

const Item = styled.li`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  gap: 1rem;
  animation: ${fadeIn} 0.3s ease forwards;

  &:last-child {
    border-bottom: none;
  }
`;

const ItemImage = styled.img`
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
  background: #f5f5f5;
`;

const ItemDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
`;

const ItemTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ItemNameWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.span`
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.95rem;
  line-height: 1.3;
  display: block;
`;

const ItemSize = styled.span`
  font-size: 0.8rem;
  color: #999;
  font-weight: 500;
  margin-top: 0.15rem;
  display: block;
`;

const ItemPrice = styled.span`
  font-weight: 700;
  color: #1a1a1a;
  font-size: 0.95rem;
  white-space: nowrap;
  flex-shrink: 0;
`;

const ItemBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
`;

const QtyBtn = styled.button`
  background: #fff;
  border: none;
  padding: 0;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #555;
  transition: all 0.15s ease;

  &:hover {
    background: #044947;
    color: white;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const QtyDisplay = styled.span`
  width: 28px;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: #1a1a1a;
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
  line-height: 30px;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  padding: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #bbb;

  &:hover {
    background: #fff1f1;
    color: #ff5a5f;
  }

  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
`;

const Footer = styled.div`
  border-top: 1px solid #f0f0f0;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fafafa;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const TotalLabel = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: #888;
`;

const TotalAmount = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.5px;
`;

const CheckoutButton = styled.button`
  background: #044947;
  color: white;
  border: none;
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;

  &:hover {
    background: #033634;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(4, 73, 71, 0.25);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ContinueLink = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: center;
  padding: 0.25rem;
  transition: color 0.2s ease;

  &:hover {
    color: #044947;
  }
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 1rem;
  text-align: center;
  animation: ${fadeIn} 0.3s ease forwards;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 28px;
    height: 28px;
    color: #ccc;
  }
`;

const EmptyText = styled.p`
  color: #999;
  font-size: 1rem;
  margin: 0;
`;

const ShopLink = styled.button`
  background: none;
  border: 1.5px solid #1a1a1a;
  color: #1a1a1a;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1a1a1a;
    color: white;
  }
`;

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, toggleCart, removeItem, updateQuantity } = useCart();

  const total = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);

  const getImageUrl = (item) => {
    if (item.image) return item.image;
    if (item.images?.[0]?.asset?.url) return item.images[0].asset.url;
    if (item.images?.[0]?.url) return item.images[0].url;
    return DEFAULT_PLACEHOLDER_IMAGE;
  };

  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClick={toggleCart} />
      <Drawer isOpen={isOpen}>
        <Header>
          <HeaderTitle>
            Your Cart
            <CartIconWrapper>
              <ShoppingBagIcon width={20} height={20} />
              {totalQty > 0 && <CartBadge>{totalQty}</CartBadge>}
            </CartIconWrapper>
          </HeaderTitle>
          <CloseBtn onClick={toggleCart}>
            <XMarkIcon />
          </CloseBtn>
        </Header>

        {items.length === 0 ? (
          <EmptyMessage>
            <EmptyIcon>
              <ShoppingBagIcon />
            </EmptyIcon>
            <EmptyText>Your cart is empty</EmptyText>
            <ShopLink onClick={() => { toggleCart(); navigate('/products'); }}>
              Browse Products
            </ShopLink>
          </EmptyMessage>
        ) : (
          <>
            <ItemList>
              {items.map((item, i) => (
                <Item key={`${item.id}-${i}`}>
                  <ItemImage
                    src={getImageUrl(item)}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = DEFAULT_PLACEHOLDER_IMAGE;
                    }}
                  />
                  <ItemDetails>
                    <ItemTopRow>
                      <ItemNameWrapper>
                        <ItemName>{item.name}</ItemName>
                        {item.selectedSize && (
                          <ItemSize>Size: {item.selectedSize}</ItemSize>
                        )}
                      </ItemNameWrapper>
                      <ItemPrice>${(item.price * item.quantity).toFixed(2)}</ItemPrice>
                    </ItemTopRow>

                    <ItemBottomRow>
                      <QuantityControls>
                        <QtyBtn
                          onClick={() =>
                            updateQuantity(item, Math.max(item.quantity - 1, 1))
                          }
                          aria-label="Decrease quantity"
                        >
                          -
                        </QtyBtn>
                        <QtyDisplay>{item.quantity}</QtyDisplay>
                        <QtyBtn
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </QtyBtn>
                      </QuantityControls>

                      <DeleteBtn onClick={() => removeItem(item)} aria-label="Remove item">
                        <TrashIcon />
                      </DeleteBtn>
                    </ItemBottomRow>
                  </ItemDetails>
                </Item>
              ))}
            </ItemList>
            <Footer>
              <TotalRow>
                <TotalLabel>Subtotal</TotalLabel>
                <TotalAmount>${total.toFixed(2)}</TotalAmount>
              </TotalRow>
              <CheckoutButton onClick={() => {
                toggleCart();
                navigate('/checkout');
              }}>
                CHECKOUT
              </CheckoutButton>
              <ContinueLink onClick={toggleCart}>
                Continue Shopping
              </ContinueLink>
            </Footer>
          </>
        )}
      </Drawer>
    </>
  );
}
