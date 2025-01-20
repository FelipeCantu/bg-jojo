import React from 'react'
import styled from 'styled-components';


function Home() {
  return (
    <VideoWrapper>
      <VideoBackground autoPlay loop muted>
        <source src={require('../assets/cloud.mp4')} type='video/mp4' alt='clouds'/>
        Your browser does not support the video tag.
      </VideoBackground>
      <Content>
        <h1>Reach Out For Help!</h1>
        <p>You Are Not Alone</p>
      </Content>
    </VideoWrapper>
  )
}


const VideoWrapper = styled.div`
  width: 100%;
  height: 100vh; 
  overflow: hidden;
`;

const VideoBackground = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; 
  z-index: -1;

`;

const Content = styled.div`
  position: relative;
  color: black;
  padding: 20px;
  font-size: 2rem;
  z-index: -1;
`;

export default Home