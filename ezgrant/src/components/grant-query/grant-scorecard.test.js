const React = require('react');
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom'
import Grant from '.';

describe('Testing Grant Scorecard', () => {
  // Define mock grant data
  const grantData = [
    ['NAME', 'Test Grant'],
    ['LOCATION', 'Bucknell'],
    ['LINK', 'www.google.com'],
    ['AMOUNT', '$1000'],
    ['ABOUT', 'This grant was created to test the app'],
    ['FREE', 'Y'],
    ['ELIGIBILITY', ['Anyone who can code']],
    ['DEADLINE', 'December'],
  ];

  // check that all fields in scorecard are rendered
  it('renders all fields correctly', () => {
    // Render the Grant component with the mock data
    const { container } = render(<Grant grant={grantData} />);
    expect(
      container.querySelector('.grant-card--collapsed .grant-card__title')
    ).toHaveTextContent('Test Grant');
    const readMore = screen.getByText("Read More");
    act(() => {
      fireEvent.click(readMore);
    });
    const readLess = screen.getByText("Read Less");
    act(() => {
      fireEvent.click(readLess);
    });
    // Use screen queries to make assertions
    expect(screen.getByText('Bucknell')).toBeInTheDocument();
    expect(screen.getByText('This grant was created to test the app')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
  });


  it('grant expansion functions correctly with button', async () => {
    // Render the Grant component with the mock data
    render(<Grant grant={grantData} />);
    const grantContainer = screen.getByTestId('grant-container');
  
    // Initial state: should not have 'expanded' class
    expect(grantContainer).not.toHaveClass('grant-card--expanded');
    
    // Click the Expand button
    const readMore = screen.getByText("Read More");
    act(() => {
      fireEvent.click(readMore);
    });
    await screen.findByTestId('grant-container', {}, { timeout: 2000 });
    const expandedGrant = screen.getByText("Read Less");
    expect(expandedGrant).toBeInTheDocument();
  });
});