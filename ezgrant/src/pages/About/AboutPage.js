import React from 'react';
import './AboutPage.css'; // Ensure this CSS file is correctly located and styled
import Header from '../header/header'; // Adjust path as per your directory structure

const AboutPage = () => {
  return (
    <div>
      <Header />
      <div className="about-page">
        <div className="hero-section">
          <h1>About EasyGrant</h1>
          <p>Empowering Artists and Students in Pursuing Their Artistic Goals</p>
        </div>
        <div className="mission-statement">
          <h2>Our Mission</h2>
          <p>
            At EasyGrants, our goal is to assist students and freelance artists in finding the right grants. 
            Navigating the world of art grants can be challenging, with many talented artists missing out on 
            opportunities. EasyGrants simplifies this search, providing a comprehensive and accessible platform.
          </p>
        </div>
        <div className="problem-solution">
          <h2>The Challenge</h2>
          <p>
            With the current complexities in locating suitable grants, only a small percentage of student artists 
            manage to continue their artistic endeavors professionally post-graduation. This difficulty hinders the 
            growth and expression of emerging artists.
          </p>
          <h2>Our Solution</h2>
          <p>
            EasyGrants emerges as a centralized platform, eliminating the exhaustive process of scouring through 
            multiple websites. It's a haven for both grant seekers and organizations, streamlining the process of 
            grant listing and application.
          </p>
        </div>
        <div className="features">
          <h2>Key Features</h2>
          <ul>
            <li>Intuitive keyword search for easy navigation.</li>
            <li>Detailed information about each organization and grant.</li>
            <li>Platform for organizations to submit and manage grants.</li>
            <li>Admin approval system to maintain grant quality and relevance.</li>
          </ul>
        </div>
        <div className="team-info">
          <h2>Meet the Team</h2>
          <p>
            The minds behind EasyGrants are Cole, Alex, Tim, and Liam - four senior computer science majors from Bucknell University.
            Created under the guidance of Professor Emily Martin, EasyGrants is more than a project; it's a passion to empower the 
            artistic community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;