import React from "react";
import styled from "styled-components";

interface Event {
  title: string;
  date: string;
  description: string;
  image: string;
}

interface EventsProps {
  events?: Event[];
}

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: url("https://static.wixstatic.com/media/88d74a1559c84402a4a957527a839260.png/v1/fill/w_1903,h_1067,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/88d74a1559c84402a4a957527a839260.png") center/cover no-repeat;
  padding: 24px;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const EventCard = styled.div`
  position: relative;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
`;

const EventContent = styled.div`
  position: absolute;
  bottom: 0;
  padding: 16px;
  color: white;
  z-index: 2;
`;

const EventTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
`;

const EventDate = styled.p`
  font-size: 14px;
  opacity: 0.9;
`;

const EventDescription = styled.p`
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.8;
`;

// ✅ Styled "Coming Soon..." Message
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
    font-size: 20px;  // 🔥 Increased font size
    font-weight: 600;
    color: white;  // ✅ Ensuring it's visible
    text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.6);  // ✅ Added shadow for contrast
    margin-top: 5px;
  }
`;


// Main Component
const EventsList: React.FC<EventsProps> = ({ events = [] }) => {
  return (
    <PageContainer>
      <ContentWrapper>
        {events.length > 0 ? (
          <Grid>
            {events.map((event, index) => (
              <EventCard key={index}>
                <EventContent>
                  <EventTitle>{event.title}</EventTitle>
                  <EventDate>{event.date}</EventDate>
                  <EventDescription>{event.description}</EventDescription>
                </EventContent>
              </EventCard>
            ))}
          </Grid>
        ) : (
          <NoEventsMessage>
            <h1>Coming Soon...</h1>
            <p>Stay tuned for the launch of new charitable activities!</p>
          </NoEventsMessage>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default EventsList;
