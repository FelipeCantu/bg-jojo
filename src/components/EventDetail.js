import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import client from '../sanityClient';
import SEO from './SEO';
import { getEventSchema } from '../utils/structuredData';
import LoadingContainer from './LoadingContainer';

const EventDetail = () => {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const { id } = useParams(); // Event ID from URL

  useEffect(() => {
    // Fetch event details from Sanity
    client
      .fetch(`*[_type == "event" && _id == $id]{title, location, date, description, image{asset->{url}}, age, doorOpenTime, venue}`, { id })
      .then((data) => {
        setEvent(data[0]);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
        setError('Failed to load event details.');
      });
  }, [id]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!event) return <LoadingContainer message="Loading event..." />;

  return (
    <PageContainer>
      <SEO
        title={event.title}
        description={event.description || `${event.title} at ${event.venue || 'TBA'}`}
        path={`/events/${id}`}
        image={event.image?.asset?.url}
        type="article"
        jsonLd={getEventSchema({
          title: event.title,
          description: event.description || `${event.title} at ${event.venue || 'TBA'}`,
          image: event.image?.asset?.url,
          date: event.date,
          venue: event.venue,
          city: event.location?.city,
          state: event.location?.state,
        })}
      />
      <ContentWrapper>
        {event.image && (
          <EventImageBanner src={event.image.asset.url} alt={event.title} />
        )}

        <CardBody>
          <EventTitle>{event.title}</EventTitle>

          <MetaRow>
            {event.venue && <MetaChip>📍 {event.venue}{event.location ? `, ${event.location.city}, ${event.location.state}` : ''}</MetaChip>}
            <MetaChip>📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</MetaChip>
            {event.doorOpenTime && <MetaChip>🕐 Doors Open: {event.doorOpenTime}</MetaChip>}
            {event.age && <MetaChip>🎟 Age: {event.age}</MetaChip>}
          </MetaRow>

          {event.description && (
            <EventDescription>{event.description}</EventDescription>
          )}
        </CardBody>
      </ContentWrapper>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  min-height: 100vh;
  background: url("https://static.wixstatic.com/media/88d74a1559c84402a4a957527a839260.png/v1/fill/w_1903,h_1067,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/88d74a1559c84402a4a957527a839260.png") center/cover no-repeat fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.5rem;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 0;
    box-shadow: none;
    min-height: 100vh;
  }
`;

const EventImageBanner = styled.img`
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;

  @media (max-width: 768px) {
    height: 220px;
  }
`;

const CardBody = styled.div`
  padding: 2rem 2.5rem;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
  }
`;

const EventTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 1.25rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.75rem;
`;

const MetaChip = styled.span`
  font-size: 0.95rem;
  color: #444;
  line-height: 1.4;
`;

const EventDescription = styled.p`
  font-size: 1rem;
  color: #555;
  line-height: 1.75;
  margin-bottom: 2rem;
  white-space: pre-line;
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 18px;
  text-align: center;
  margin-top: 20px;
`;

export default EventDetail;
