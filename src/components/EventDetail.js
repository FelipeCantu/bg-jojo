import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import client from '../sanityClient';
import { auth, db } from '../firestore'; // Import Firestore
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import SEO from './SEO';
import { getEventSchema } from '../utils/structuredData';

const EventDetail = () => {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [user, setUser] = useState(null);
  const { id } = useParams(); // Event ID from URL

  useEffect(() => {
    // Get the current logged-in user
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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

    // Fetch attendees from Firestore
    const fetchAttendees = async () => {
      const eventRef = doc(db, 'events', id);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        setAttendees(eventSnap.data().attendees || []);
      }
    };

    fetchAttendees();
  }, [id]);

  const isUserAttending = user && attendees.includes(user.uid);

  // Function to add attendee to the event
  const addAttendeeToEvent = async (eventId, userId) => {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);

    try {
      if (eventSnap.exists()) {
        await updateDoc(eventRef, {
          attendees: arrayUnion(userId),
        });
      } else {
        // If the event doesn't exist, create it with the attendee
        await setDoc(eventRef, { attendees: [userId] }, { merge: true });
      }
    } catch (error) {
      console.error('Error adding attendee:', error);
    }
  };


  // Function to toggle attending status
  const handleToggleAttend = async () => {
    if (!user) return alert('Please log in to join the event.');

    const eventRef = doc(db, 'events', id);

    try {
      if (isUserAttending) {
        // Remove user from the attendees list
        await updateDoc(eventRef, {
          attendees: arrayRemove(user.uid),
        });
      } else {
        // Add user to the attendees list using addAttendeeToEvent
        await addAttendeeToEvent(id, user.uid);  // Call your existing function here
      }

      // Fetch updated attendees list
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        setAttendees(eventSnap.data().attendees || []);
      }

    } catch (error) {
      console.error('Error updating attendees:', error);
    }
  };

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!event) return <div>Loading...</div>;

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
        <EventTitle>{event.title}</EventTitle>
        <EventVenue>{event.venue}</EventVenue>
        <EventLocation>{event.location.city}, {event.location.state}</EventLocation>
        <EventDate>{new Date(event.date).toLocaleDateString()}</EventDate>
        {event.image && <EventImage src={event.image.asset.url} alt={event.title} />}
        <EventDescription>{event.description}</EventDescription>
        <EventDetails>
          <EventAge>Age: {event.age}</EventAge>
          <EventDoorOpen>Doors Open: {event.doorOpenTime}</EventDoorOpen>
        </EventDetails>

        {/* Join/Leave Event Button */}
        <AttendButton onClick={handleToggleAttend}>
          {isUserAttending ? 'Leave Event' : 'Join Event'}
        </AttendButton>

        {/* Attendee Count */}
        <AttendeeCount>{attendees.length} people are going</AttendeeCount>
      </ContentWrapper>
    </PageContainer>
  );
};

const AttendButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #024a47;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #013d3b;
  }
`;

const AttendeeCount = styled.p`
  margin-top: 10px;
  font-size: 16px;
  color: #555;
`;

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

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    border-radius: 0;
    padding: 15px;
  }
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

const EventDoorOpen = styled.p`
  font-size: 16px;
  color: #333;
`;

const EventVenue = styled.p`
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-top: 10px;
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 18px;
  text-align: center;
  margin-top: 20px;
`;

export default EventDetail;
