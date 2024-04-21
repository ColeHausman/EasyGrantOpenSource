import React, {useState} from 'react';
import moment from 'moment';
import './post-grants-user-page.css';
import { Form, Input, InputNumber, Button, Select, DatePicker, message, Radio} from 'antd';
import Header from '../header/header';
const PostGrantPage = () => {
  const [form] = Form.useForm();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({});

  const postGrant = async (values) => { 
    // Log the form values
    const dateSubmitted = moment().format();
    values.DATESUBMITTED = dateSubmitted;
    values.DEADLINE = values.DEADLINE ? values.DEADLINE.format("MMMM D, YYYY") : null;
    
    try {
      const response = await fetch('/api/addToGrantQueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
  
      if (!response.ok) {
        throw new Error('Network response failed.');
      }
  
      const body = await response.json();
      console.log(body.message);
      message.success('Grant submitted successfully!');
      form.resetFields(); 
    } catch (error) {
      console.error('Fetch Error:', error);
      message.error('Failed to submit the grant.');
  }

  };
  const handleCategoryChange = (value, option) => {
    // Handle category change
  };

  const validateDeadline = (_, value) => {
    if (!value) {
      // If no value is provided, the field is required
      return Promise.reject(new Error('Please select a deadline.'));
    } else if (value.isBefore(moment().startOf('day'))) {
      // If the selected date is before the start of today, reject the promise
      return Promise.reject(new Error('Grant deadline cannot be in the past!'));
    }
    // Otherwise, resolve the promise (the date is either today or in the future)
    return Promise.resolve();
  };

  const handleInputChange = (name, value) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleDatePickerChange = (date, fieldName) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [fieldName]: date ? date.format('MMMM D, YYYY') : null,
    }));
  };

  const redirectToHome = () => {
    window.location.href = '/';
  };

  const artsCategories = [
    "Acting",
    "Animation",
    "Architecture",
    "Art Conservation",
    "Art Education",
    "Art History",
    "Artists",
    "Book Arts",
    "Choreography",
    "Costume/Fashion Design",
    "Dance",
    "Digital Fabrication",
    "Digital Media",
    "Documentary",
    "Drawing",
    "Electronic Arts",
    "Environmental Arts",
    "Fiction",
    "Film",
    "Fine Metals/Jewelry",
    "Glass Arts",
    "Graphic Design",
    "Illustration",
    "Installation Arts",
    "Interdisciplinary Arts",
    "Journalism",
    "Landscape Architecture",
    "Literary Nonfiction",
    "Literature",
    "Mixed Media",
    "Moving Image",
    "Multimedia Arts",
    "Music",
    "New Genres",
    "Nonfiction",
    "Opera",
    "Painting",
    "Paper Arts",
    "Performance Art",
    "Photography",
    "Playwriting",
    "Poetry",
    "Printmaking",
    "Public Art",
    "Sculpture",
    "Screenwriting",
    "Social Practice",
    "Sound Art",
    "Storytelling",
    "Symphony",
    "TV + Radio",
    "Textile & Fiber Arts/Weaving",
    "Theater",
    "Urban Planning/Design",
    "Visual Arts",
    "Woodworking",
    "Writing",
  ];

  const artsCategoryOptions = artsCategories.map(category => ({
    label: category,
    value: category,
  }));
    

  return (
    <div>
      <Header />
      <h1 className="post-grant-title">Post a Grant</h1>
      <Form form={form} onFinish={(values) => postGrant(values)} className="form-container" layout="vertical" colon={false}>
        <div className="form-column-1">
        <div className="form-item">
          <Form.Item
            label="Title"
            name="NAME"
            rules={[
              { required: true, message: 'Please enter the title' },
              { max: 255, message: 'Title must be at most 255 characters' },
            ]}
          >
            <Input className="custom-input" onChange={(e) => handleInputChange('NAME', e.target.value)} 
            size="large" placeholder="Program Title"/>
          </Form.Item>
        </div>
        <div className="form-item">
          <Form.Item
            label="Deadline"
            name="DEADLINE"
            rules={[{ required: false, message: 'Please select a deadline' }]}
          >
            <DatePicker
              onChange={(date) => handleDatePickerChange(date, 'DEADLINE')}
              format="MMMM D, YYYY"
              size="large"
              className="custom-input"
              placeholder=''
            />
          </Form.Item>
        </div>
        <div className="form-item">
          <Form.Item
            label="Location"
            name="LOCATION"
            rules={[
              { required: false, message: 'Please enter the location' },
              { max: 255, message: 'Location must be at most 255 characters' },
            ]}
          >
            <Input className="custom-input" onChange={(e) => handleInputChange('LOCATION', e.target.value)} 
            size="large" placeholder="City, State, Country / Online"/>
          </Form.Item>
        </div>
        <div className="form-item">
          <Form.Item
            label="Link to the grant"
            name="LINK"
            rules={[
              { required: true, message: 'Please enter the link' },
              { max: 255, message: 'Link must be at most 255 characters' },
            ]}
          >
            <Input className="custom-input" onChange={(e) => handleInputChange('LINK', e.target.value)} 
            size="large" placeholder="Official application page"/>
          </Form.Item>
        </div>
        </div>
        <div className="form-column-2">
          <div className="form-item">
            <Form.Item
              label="Select eligible disciplines"
              name="ELIGIBILITY"
              rules={[{ required: false, message: 'Please enter the eligibility' }]}
              options={artsCategories}
            >
              <Select
                mode="tags"
                onChange={(values) => handleInputChange('ELIGIBILITY', values)}
                size="large"
                className="custom-select"
                placeholder="Select options or write in new ones"
                options={artsCategoryOptions}
              />
            </Form.Item>
          </div>
          <div className="form-item">
            <Form.Item
              label="Funding available"
              name="AMOUNT"
              rules={[
                { required: false, message: 'Please enter the amount' },
                { type: 'number', message: 'Amount must be a number' },
              ]}
            >
              <InputNumber 
                className="custom-input"
                type="number"
                onChange={(value) => `${value}`.replace(/[^0-9]/g, '')} 
                formatter={(value) => `${value}`.replace(/[^0-9]/g, '')}
                parser={(value) => value.replace(/[^0-9]/g, '')} size="large"
                placeholder="ex. 2000"
              />
            </Form.Item>
          </div>
        </div>
        <div className="form-column-3">
        <div className="form-item">
        <Form.Item
            label="Description"
            name="ABOUT"
            rules={[
              { required: false, message: 'Please enter the about information' },
              { max: 4000, message: 'Description must be at most 4000 characters' },
            ]}
          >
            <Input.TextArea 
              className="custom-text-area"
              value={formValues.ABOUT} 
              onChange={(e) => handleInputChange('ABOUT', e.target.value)} 
              rows={7}
              placeholder="Please summarize important information -
              application requirements, pay, etc."
            />
          </Form.Item>
        </div>
        <div className="form-item">
        <Form.Item
          label="Is this grant FREE?"
          name="FREE"
          rules={[{ required: false, message: 'Please select the free information' }]}
        >
          <Radio.Group
            value={formValues.FREE === null ? 'Unknown' : formValues.FREE}
            onChange={(e) => handleInputChange('FREE', e.target.value)}
          >
            <div className="custom-radio">
              <Radio value="Y" className="square-radio">
                Yes
              </Radio>
            </div>
            <div className="custom-radio">
              <Radio value="N" className="square-radio">
                No
              </Radio>
            </div>
            <div className="custom-radio">
              <Radio value="" className="square-radio">
                Unknown
              </Radio>
            </div>
          </Radio.Group>
        </Form.Item>
        </div>
        <div>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
        </div>
        </div>
      </Form>
    </div>
  );
};

export default PostGrantPage;