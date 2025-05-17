import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ShoppingBagIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '../CartContext';
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
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transform: translateX(${({ isOpen }) => (isOpen ? '0' : '100%')});
  animation: ${({ isOpen }) =>
    isOpen
      ? css`${slideIn} 0.3s ease forwards`
      : css`${slideOut} 0.3s ease forwards`};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #333;
`;

const CartIconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const CartBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff5a5f;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 50%;
  width: 20px;
  height: 20px;
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
    background: #e0e0e0;
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
  scrollbar-color: #ddd transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 3px;
  }
`;

const Item = styled.li`
  padding: 1.25rem 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 1rem;
  animation: ${fadeIn} 0.3s ease forwards;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
`;

const ItemName = styled.span`
  font-weight: 500;
  color: #333;
  flex: 1;
`;

const ItemPrice = styled.span`
  font-weight: 600;
  color: #333;
  min-width: 80px;
  text-align: right;
`;

const ItemSize = styled.span`
  font-size: 0.85rem;
  color: #777;
  margin-top: 0.25rem;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const QtyBtn = styled.button`
  background: #f5f5f5;
  border: none;
  padding: 0.25rem 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background: #e0e0e0;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const QtyDisplay = styled.span`
  width: 30px;
  text-align: center;
  font-weight: 500;
`;

const DeleteBtn = styled.button`
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #ffebee;
    color: #ff5a5f;
  }

  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
`;

const Total = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TotalLabel = styled.span`
  font-size: 1.1rem;
  font-weight: 500;
`;

const TotalAmount = styled.span`
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
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
  width: 60px;
  height: 60px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 28px;
    height: 28px;
    color: #999;
  }
`;

const EmptyText = styled.p`
  color: #777;
  font-size: 1.1rem;
  margin: 0;
`;

const CheckoutButton = styled.button`
  background: #333;
  color: white;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1.5rem;

  &:hover {
    background: #222;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ItemImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 1rem;
`;

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, toggleCart, removeItem, updateQuantity } = useCart();

  const total = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);

  // Helper function to get the image URL
  const getImageUrl = (item) => {
    // Handle different image formats from Sanity or other sources
    if (item.image) {
      // If image is a direct URL string
      return item.image;
    } else if (item.images?.[0]?.asset?.url) {
      // If image is from Sanity (array format)
      return item.images[0].asset.url;
    } else if (item.images?.[0]?.url) {
      // If image is in a simpler array format
      return item.images[0].url;
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClick={toggleCart} />
      <Drawer isOpen={isOpen}>
        <Header>
          <Title>
            Your Cart
            <CartIconWrapper>
              <ShoppingBagIcon width={22} height={22} />
              {totalQty > 0 && <CartBadge>{totalQty}</CartBadge>}
            </CartIconWrapper>
          </Title>
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
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <TopRow>
                      <div>
                        <ItemName>{item.name}</ItemName>
                        {item.size && (
                          <ItemSize>Size: {item.size}</ItemSize>
                        )}
                        {item.selectedSize && (
                          <ItemSize>Size: {item.selectedSize}</ItemSize>
                        )}
                      </div>
                      <ItemPrice>${(item.price * item.quantity).toFixed(2)}</ItemPrice>
                    </TopRow>
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
                      <DeleteBtn onClick={() => removeItem(item)} aria-label="Remove item">
                        <TrashIcon />
                      </DeleteBtn>
                    </QuantityControls>
                  </div>
                </Item>
              ))}
            </ItemList>
            <Total>
              <TotalLabel>Total:</TotalLabel>
              <TotalAmount>${total.toFixed(2)}</TotalAmount>
            </Total>
            <CheckoutButton onClick={() => {
              toggleCart();
              navigate('/checkout');
            }}>
              Proceed to Checkout
            </CheckoutButton>
          </>
        )}
      </Drawer>
    </>
  );
}