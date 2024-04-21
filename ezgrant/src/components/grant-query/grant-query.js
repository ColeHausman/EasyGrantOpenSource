// Import necessary modules and components
import React, { useState, useRef, useEffect } from "react";
import { 
    EnvironmentOutlined, DollarCircleOutlined, CalendarOutlined, 
    TagsOutlined, UserOutlined, IdcardOutlined, LinkOutlined, 
    InfoCircleOutlined, CheckCircleOutlined 
} from '@ant-design/icons';  // Import Ant Design icons
import { ArrowRightOutlined } from '@ant-design/icons';
import { Card, Tag, Checkbox, Button } from 'antd';  // Import Ant Design Card component
import './grant-query.css';  // Import custom CSS
// Define a constant for the field keys
const FIELD_KEYS = {
    NAME: "NAME",
    LOCATION: "LOCATION",
    AMOUNT: "AMOUNT",
    DEADLINE: "DEADLINE",
    CATEGORY: "CATEGORY",
    SPONSOR: "SPONSOR",
    LINK: "LINK",
    ABOUT: "ABOUT",
    // ELIGIBILITY: "ELIGIBILITY", // Ignored as per your instruction
  };

  // Define a mapping of field keys to their icons
  const FIELD_ICONS = {
    [FIELD_KEYS.NAME]: <IdcardOutlined />,
    [FIELD_KEYS.LOCATION]: <EnvironmentOutlined />,
    [FIELD_KEYS.AMOUNT]: <DollarCircleOutlined />,
    [FIELD_KEYS.DEADLINE]: <CalendarOutlined />,
    [FIELD_KEYS.CATEGORY]: <TagsOutlined />,
    [FIELD_KEYS.SPONSOR]: <UserOutlined />,
    [FIELD_KEYS.LINK]: <LinkOutlined />,
    [FIELD_KEYS.ABOUT]: <InfoCircleOutlined />,
    // ... Add other mappings as needed
  };

export const Grant = (props) => {
    // State to manage whether the card is expanded or not
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAboutExpanded, setAboutExpanded] = useState(false);

    // Reference to the grant container for click outside functionality
    const grantRef = useRef(null);
   
    // Function to toggle the expanded/collapsed state of the card
    const handleExpandCollapse = () => {
        setAboutExpanded(!isAboutExpanded);
        setIsExpanded(!isExpanded);        
    };

    const onGrantContainerResize = () => {
      if (grantRef.current && props.setHeight) {
        props.setHeight(grantRef.current.clientHeight);
      }
    };

    useEffect(() => {
      onGrantContainerResize();
    }, [isExpanded, isAboutExpanded]);

    // Extract grant data
    const grantData = Object.fromEntries(props.grant);
    const { NAME, LOCATION, DEADLINE, ABOUT, AMOUNT, LINK, FREE, ELIGIBILITY } = grantData;
    const numTagsToShow = 3; // or 4 based on your preference
    const visibleTags = isExpanded ? ELIGIBILITY : ELIGIBILITY.slice(0, numTagsToShow);
    const isTruncated = !isExpanded && ELIGIBILITY.length > numTagsToShow;

    const truncateText = (text, maxLines) => {
      if (!text) {
        return ''; // Handle null or undefined values
      }
      const lines = text.split('\n');
      const truncatedLines = lines.slice(0, maxLines);
      return truncatedLines.join('\n');
    };

    return (
      <div data-testid="grant-container" ref={grantRef} className={`grant-card ${isExpanded ? "grant-card--expanded" : "grant-card--collapsed"}`}>
        <Card>
          <div className="grant-card__header">
            {/* Conditional rendering for each field */}
            <div className="grant-card__title">{NAME || 'No Title Provided'}</div>
            <div className="grant-card__deadline">{DEADLINE || 'No Deadline Provided'}</div>
            <div className="location-col">
              <div className="grant-card__location">{LOCATION || 'No Location Provided'}</div>
              <div className="grant-card__amount">{AMOUNT && AMOUNT !== '0' ? `$${Number(AMOUNT).toLocaleString()} in funding avaliable` : ''}</div>
            </div>
            <div className="column-four">
              {/* Conditional rendering for eligibility tags */}
              <div className={`grant-card__eligibility ${isExpanded ? "" : "grant-card__eligibility--collapsed"}`}>
                {ELIGIBILITY && ELIGIBILITY.length > 0 ? 
                  ELIGIBILITY.slice(0, isExpanded ? ELIGIBILITY.length : 3).map((tag,idx) => <Tag bordered={false} color='#2596be' key={tag}>{tag}</Tag>) :
                  <span>No Eligibility Criteria Provided</span>
                }
                {!isExpanded && ELIGIBILITY && ELIGIBILITY.length > 3 && <span className="ellipsis">...</span>}
              </div>
              {/* About section */}
              <div className={`grant-card__about ${isAboutExpanded ? 'grant-card__about--expanded' : ''}`}>
                {ABOUT}
              </div>
              <Button
                className="grant-card__read-more"
                type="link"
                onClick={handleExpandCollapse}
              >
                {isAboutExpanded ? "Read Less" : "Read More"}
              </Button>
          </div>
          <div className="grant-action-links">
          <a href={LINK || '#'} target="_blank" rel="noopener noreferrer" className="grant-apply-link">
              {LINK ? FREE === 'Y' ? 'Apply (free)' : 'Apply' : 'No Link Provided'}
              {LINK && <LinkOutlined style={{ marginLeft: '5px' }} />}
            </a>
          </div>
          </div>
        </Card>
      </div>
    );
    

};