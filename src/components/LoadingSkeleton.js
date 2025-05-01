import styled from "styled-components";

const LoadingSkeleton = () => {
    return (
      <SkeletonContainer>
        <SkeletonImages>
          <SkeletonMainImage />
          <SkeletonThumbnails>
            {[...Array(4)].map((_, index) => (
              <SkeletonThumbnail key={index} />
            ))}
          </SkeletonThumbnails>
        </SkeletonImages>
        
        <SkeletonDetails>
          <SkeletonTitle />
          <SkeletonPrice />
          <SkeletonVariants>
            <SkeletonVariant />
            <SkeletonVariant />
            <SkeletonVariant />
          </SkeletonVariants>
          <SkeletonDescription />
          <SkeletonDescription />
          <SkeletonButton />
        </SkeletonDetails>
      </SkeletonContainer>
    );
  };
  
  // Styled components for the skeleton
  const SkeletonContainer = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    gap: 3rem;
  
    @media (max-width: 768px) {
      flex-direction: column;
    }
  `;
  
  const SkeletonImages = styled.div`
    flex: 1;
  `;
  
  const SkeletonMainImage = styled.div`
    width: 100%;
    height: 500px;
    background: #f0f0f0;
    border-radius: 8px;
    margin-bottom: 1rem;
    animation: pulse 1.5s infinite ease-in-out;
  
    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.3; }
    }
  `;
  
  const SkeletonThumbnails = styled.div`
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  `;
  
  const SkeletonThumbnail = styled.div`
    width: 80px;
    height: 80px;
    background: #f0f0f0;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
  `;
  
  const SkeletonDetails = styled.div`
    flex: 1;
  `;
  
  const SkeletonTitle = styled.div`
    width: 70%;
    height: 32px;
    background: #f0f0f0;
    margin-bottom: 1.5rem;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
  `;
  
  const SkeletonPrice = styled.div`
    width: 30%;
    height: 28px;
    background: #f0f0f0;
    margin-bottom: 2rem;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
  `;
  
  const SkeletonVariants = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
  `;
  
  const SkeletonVariant = styled.div`
    width: 80px;
    height: 40px;
    background: #f0f0f0;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
  `;
  
  const SkeletonDescription = styled.div`
    width: 100%;
    height: 16px;
    background: #f0f0f0;
    margin-bottom: 0.8rem;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
  
    &:last-of-type {
      width: 80%;
    }
  `;
  
  const SkeletonButton = styled.div`
    width: 200px;
    height: 50px;
    background: #f0f0f0;
    margin-top: 2rem;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
  `;
  
  export default LoadingSkeleton;