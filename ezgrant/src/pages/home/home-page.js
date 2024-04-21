import React, { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './home-page.css';
import Grant from '../../components/grant-query';
import { Link } from 'react-router-dom';
import Header from '../header/header';
const { Search } = Input;

const HomePage = () => {
  const [state, setState] = useState({
    response: '',
    post: '',
    responseToPost: [],
    selectedAmount: '',
    selectedDate: '',
    selectedEligibility: ''
  });

  const setResponseToPost = (data) => {
    setState((prevState) => ({ ...prevState, responseToPost: data }));
  };
  const examplePlaceholders = [
    "Search by keywords, like 'education grants in California'",
    "Try 'small business grants in Texas for 2023'",
    "Enter 'grants for renewable energy projects'",
    // ... other examples ...
  ];
  const [placeholder, setPlaceholder] = useState("");

   // Function to get a random placeholder
   const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * examplePlaceholders.length);
    return examplePlaceholders[randomIndex];
  };

  useEffect(() => {
    
    const fetchMainGrantQueue = async () => {
      try {
        const response = await fetch('/api/getMainGrantQueue', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const body = await response.json();
        if (body.express) {
          const results = body.express.map((obj) => Object.entries(obj));
          setResponseToPost(results);
        } else {
          setResponseToPost([]);
        }
      } catch (error) {
        console.error('Error during fetch operation:', error);
        setResponseToPost([]);
      }
    };

    fetchMainGrantQueue();
  }, []);
  useEffect(() => {
    // Define the array of example placeholders
    const examplePlaceholders = [
      "Education grants in California under 2000",
      "Small business grants in Texas for 2023",
      "Grants for renewable energy projects",
      "Grants for renewable energy projects",
      "Technology research funding in New York",
      "Undergraduate scholarships for biology students",
      "Arts and culture grants in Boston",
      "Healthcare innovation grants in Florida",
      "Environmental conservation funds in Canada",
      "Grants for women entrepreneurs in tech",
      "Funding opportunities for non-profits in education"
    ];
  
    // Function to get a random placeholder
    const getRandomPlaceholder = () => {
      const randomIndex = Math.floor(Math.random() * examplePlaceholders.length);
      return examplePlaceholders[randomIndex];
    };
  
    // Set initial placeholder
    setPlaceholder(getRandomPlaceholder());
  
    // Set interval to change the placeholder every 5 seconds
    const intervalId = setInterval(() => {
      setPlaceholder(getRandomPlaceholder());
    }, 3200);
  
    // Return a function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); 

  const handleSearch = async (value) => {
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: value }),
      });

      const body = await response.json();
      if (body.express) {
        let results = body.express.map((obj) => Object.entries(obj));
        setResponseToPost(results);
      } else {
        setResponseToPost([]);
      }
    } catch (error) {
      console.error('Error during fetch operation:', error);
      setResponseToPost([]);
    }
  };

  const redirectToHome = () => {
    window.location.href = '/';
  };

  return (
    <div >
      <Header />
      <div className="home-search-bar-container">
        <Search
          className="home-search-input" 
          value={state.post}
          onChange={(e) => setState((prevState) => ({ ...prevState, post: e.target.value }))}
          placeholder={placeholder}
          onSearch={handleSearch}
          enterButton={<Button className="home-search-button" icon={<SearchOutlined />}>Search</Button>}
        />
      </div>
      {state.responseToPost.length > 0 && (
        <div className="home-grant-header">
          <div className="home-grant-detail">Title</div>
          <div className="home-grant-detail">Deadline</div>
          <div className="home-grant-detail">Location</div>
          <div className="home-grant-detail">Notes</div>
        </div>
      )}
      {state.responseToPost.map((obj, index) => (
        <div className="home-grant-card-container" key={index}>
          <Grant grant={obj} />
        </div>
      ))}
    </div>
  );
};

export default HomePage;