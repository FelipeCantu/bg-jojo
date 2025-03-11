import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const CreateArticleButton = () => {
    return (
        <Link to="/create-article">
            <FloatingButton>+</FloatingButton>
        </Link>
    );
};

const FloatingButton = styled.button`
    position: fixed;
    bottom: 30px;
    right: 30px;
    background-color: #fe592a;  /* Updated color */
    color: white;
    border: none;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
    z-index: 1000;  /* Ensure it's on top of other elements */

    &:hover {
        background-color: #f14e1f; 
    }

    &:focus {
        outline: none;
    }

    /* For mobile responsiveness */
    @media (max-width: 600px) {
        width: 50px;
        height: 50px;
        font-size: 30px;
    }

    @media (max-width: 400px) {
        width: 45px;
        height: 45px;
        font-size: 28px;
    }
`;

export default CreateArticleButton;
