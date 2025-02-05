import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';  // Importing React Router for navigation
import styled from 'styled-components';
import client from '../sanityClient';  // Import your Sanity client

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Query to fetch events from Sanity
    client
      .fetch('*[_type == "event"]{_id, title, location, date}')  // Fetching necessary fields
      .then((data) => {
        setEvents(data);
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
      });
  }, []);

  return (
    <PageContainer>
      <ContentWrapper>
        {events.length > 0 ? (
          <EventList>
            {events.map((event) => (
              <EventItem key={event._id}>
                <Link to={`/events/${event._id}`}>
                  <EventTitle>{event.title}</EventTitle>
                  <EventLocation>
                    {event.location.city}, {event.location.state}
                  </EventLocation>
                  <EventDate>{new Date(event.date).toLocaleDateString()}</EventDate>
                </Link>
              </EventItem>
            ))}
          </EventList>
        ) : (
          <NoEventsMessage>
            <h1>No Events Found</h1>
            <p>Stay tuned for upcoming events!</p>
          </NoEventsMessage>
        )}
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
`;

const EventList = styled.ul`
  list-style: none;
  padding: 0;
`;

const EventItem = styled.li`
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);

  a {
    text-decoration: none;
    color: #333;
  }

  &:hover {
    background: rgba(255, 255, 255, 1);
  }
`;

const EventTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #333;
`;

const EventLocation = styled.p`
  font-size: 14px;
  color: #777;
`;

const EventDate = styled.p`
  font-size: 14px;
  color: #555;
`;

const EventDetails = styled.div`
  margin-top: 8px;
`;

const EventAge = styled.p`
  font-size: 14px;
  color: #333;
`;

const EventRunningTime = styled.p`
  font-size: 14px;
  color: #333;
`;

const EventDoorOpen = styled.p`
  font-size: 14px;
  color: #333;
`;

const NoEventsMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  padding: 30px;
  color: white;

  h1 {
    font-size: 48px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.4);
    margin-bottom: 10px;
  }

  p {
    font-size: 20px;
    font-weight: 600;
    color: white;
    text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.6);
    margin-top: 5px;
  }
`;

export default Events;
