import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';  // For getting route parameters
import styled from 'styled-components';
import client from '../sanityClient';  // Import your Sanity client

const EventDetail = () => {
  const [event, setEvent] = useState(null);
  const { id } = useParams();  // Getting the event ID from the URL

  useEffect(() => {
    // Query to fetch the event details from Sanity by ID
    client
      .fetch(`*[_type == "event" && _id == $id]{title, location, date, description, image{asset->{url}}, age, approximateRunningTime, doorOpenTime}`, { id })
      .then((data) => {
        setEvent(data[0]);
      })
      .catch((error) => {
        console.error('Error fetching event details:', error);
      });
  }, [id]);

  if (!event) return <div>Loading...</div>;

  return (
    <PageContainer>
      <ContentWrapper>
        <EventTitle>{event.title}</EventTitle>
        <EventLocation>{event.location.city}, {event.location.state}</EventLocation>
        <EventDate>{new Date(event.date).toLocaleDateString()}</EventDate>
        {event.image && <EventImage src={event.image.asset.url} alt={event.title} />}
        <EventDescription>{event.description}</EventDescription>
        <EventDetails>
          <EventAge>Age: {event.age}</EventAge>
          <EventRunningTime>Running Time: {event.approximateRunningTime}</EventRunningTime>
          <EventDoorOpen>Doors Open: {new Date(event.doorOpenTime).toLocaleTimeString()}</EventDoorOpen>
        </EventDetails>
      </ContentWrapper>
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: url("https://static.wixstatic.com/media/88d74a1559c84402a4a957527a839260.png/v1/fill/w_1903,h_1067,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/88d74a1559c84402a4a957527a839260.png") center/cover no-repeat;
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  padding: 24px;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const EventTitle = styled.h2`
  font-size: 28px;
  font-weight: bold;
  color: #333;
`;

const EventLocation = styled.p`
  font-size: 18px;
  color: #777;
`;

const EventDate = styled.p`
  font-size: 16px;
  color: #555;
`;

const EventImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 20px;
`;

const EventDescription = styled.p`
  font-size: 18px;
  margin-top: 20px;
  color: #333;
`;

const EventDetails = styled.div`
  margin-top: 20px;
`;

const EventAge = styled.p`
  font-size: 16px;
  color: #333;
`;

const EventRunningTime = styled.p`
  font-size: 16px;
  color: #333;
`;

const EventDoorOpen = styled.p`
  font-size: 16px;
  color: #333;
`;

export default EventDetail;
