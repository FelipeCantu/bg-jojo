import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { client, urlFor } from "../sanityClient";
import LoadingContainer from "./LoadingContainer";
import styled from "styled-components";

const TributeDetail = () => {
  const { slug } = useParams();
  const [tribute, setTribute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .fetch(`*[_type == "tribute" && slug.current == $slug][0]`, { slug })
      .then((data) => {
        setTribute(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <LoadingContainer message="In Memory Of..." />;

  if (!tribute) return <ErrorText>Oops! Tribute not found.</ErrorText>;

  const formattedDate = tribute.date
    ? new Date(tribute.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "Date not available";

  return (
    <DetailContainer>
      <Image src={urlFor(tribute.image).url()} alt={tribute.name} />
      <Name>{tribute.name}</Name>
      <TributeDate>{formattedDate}</TributeDate>
      <Bio>{tribute.bio || "No biography available."}</Bio>
    </DetailContainer>
  );
};

// Styled Components

const DetailContainer = styled.div`
  text-align: center;
  padding: 40px;
  background-color: #f9f9f9;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    margin: 0;
    border-radius: 0;
    padding: 20px 10px;
  }
`;

const Image = styled.img`
  width: 100%;
  max-width: 600px;
  border-radius: 10px;
  margin-bottom: 20px;
`;

const Name = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-top: 20px;
  color: #2c3e50;
`;

const TributeDate = styled.p`
  font-size: 18px;
  color: #7f8c8d;
  margin-top: 10px;
`;

const Bio = styled.p`
  font-size: 16px;
  margin-top: 20px;
  line-height: 1.6;
  color: #34495e;
  max-width: 700px;
  margin: 20px auto;
`;

const LoadingText = styled.div`
  text-align: center;
  font-size: 20px;
  color: #34495e;
`;

const ErrorText = styled.div`
  text-align: center;
  font-size: 20px;
  color: #e74c3c;
`;

export default TributeDetail;
