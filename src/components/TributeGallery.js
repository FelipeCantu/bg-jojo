import React, { useEffect, useState } from "react";
import { client, urlFor } from "../sanityClient";
import Remembering from "./Remembering";
import styled from "styled-components";

const TributeGallery = () => {
  const [tributes, setTributes] = useState([]);

  useEffect(() => {
    console.log("Fetching data from Sanity...");
    client
      .fetch('*[_type == "tribute"]{_id, name, image, slug}')
      .then((data) => {
        console.log("✅ Fetched tributes:", data); // Log full response
        setTributes(data);
      })
      .catch((error) => {
        console.error("❌ Sanity fetch error:", error);
      });
  }, []);

  return (
    <Container>
      <Header>
        <Title>In Memory Of</Title>
        <Description>
          These individuals brought light into our lives and will always be remembered. We honor their memory and the impact they had on those around them.
        </Description>
      </Header>

      <GalleryContainer>
        {tributes.length === 0 && <NoTributesText>⚠️ No tributes found.</NoTributesText>}
        {tributes.map((tribute) => {
          const imageUrl = tribute.image?.asset
            ? urlFor(tribute.image).url()
            : "/images/logo192.png";

          return (
            <Remembering
              key={tribute._id}
              name={tribute.name}
              imageUrl={imageUrl}
              slug={tribute.slug?.current}
            />
          );
        })}
      </GalleryContainer>
    </Container>
  );
};

// Styled Components

const Container = styled.div`
  padding: 40px 20px;
  background-color: #f9f9f9;
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h2`
  font-size: 36px;
  color: #2c3e50;
  font-weight: 700;
  margin-bottom: 10px;
`;

const Description = styled.p`
  font-size: 18px;
  color: #7f8c8d;
  line-height: 1.5;
  max-width: 700px;
  margin: 0 auto;
`;

const GalleryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
  padding: 0 20px;
`;

const NoTributesText = styled.p`
  font-size: 18px;
  color: #e74c3c;
  text-align: center;
  grid-column: span 3;
`;

export default TributeGallery;
