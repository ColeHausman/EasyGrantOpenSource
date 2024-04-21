import React from 'react';
import './FAQPage.css'; // Ensure this CSS file is correctly located and styled
import Header from '../header/header'; // Adjust path as per your directory structure

const FAQPage = () => {
  return (
    <div>
      <Header />
      <div className="faq-page">
        <h1>Frequently Asked Questions</h1>

        <div className="faq-item">
          <h2>What do I search?</h2>
          <p>Our search bar is designed to be as intuitive as possible and can accomidate natural language. Search for locations, disciplines such as "music", an amount of money, and a deadline all at the same time.</p>
        </div>

        <div className="faq-item">
          <h2>How often is the grant database updated?</h2>
          <p>Our database is updated regularly to ensure you have access to the latest grant opportunities. We strive to provide the most current information available. We always appreciate your submitted grants to keep our database growing!</p>
        </div>

        <div className="faq-item">
          <h2>Can anyone submit grants to EasyGrants?</h2>
          <p>Yes, anyone can submit a grant they offer or a grant they found. Submitted grants are subject to approval by our admin team to ensure relevancy and accuracy.</p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;