import React, { useState, useEffect } from "react";
import moment from "moment";
import dayjs from 'dayjs';
import { Form, Input, Button, Alert, Layout, Menu, Dropdown, Table, message} from 'antd';
import "./admin-page.css";
import { Modal, Empty, DatePicker, Select, InputNumber, Tag } from 'antd';
import { Switch } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
const { Option } = Select;
const { Content } = Layout;


function AdminPage() {
  const logout = () => {
    setIsSubmitted(false);
  };
  const [grants, setGrants] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [form] = Form.useForm();
  const [isViewing, setIsViewing] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mode, setMode] = useState("userQueue");
  const [openModalFor, setOpenModalFor] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState(new Set());
  const [formValues, setFormValues] = useState({
    NAME: '',
    LOCATION: '',
    LINK: '',
    AMOUNT: '',
    ABOUT: '',
    FREE: '',
    ELIGIBILITY: '',
    DEADLINE: '',
    ID: '',
  });


  const errors = {
    uname: "Invalid username",
    pass: "Invalid password"
  };
  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={logout}>
        Log Out
      </Menu.Item>
    </Menu>
  );
  const handleDelete = async (grant, mode) => {
    try {
      const response = await fetch('/api/removeFromGrantQueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: [mode, grant.ID] }),
      });
      const body = await response.json();
      setGrants(body);
      message.success('Grant deleted successfully!');
    } catch (error) {
      console.error('Error during delete operation:', error);
    }
  };
  
  const handleModify = async (grant) => {
    try {
      const response = await fetch('/api/getGrantByID', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: [mode, grant.ID] }),
      });
  
      const body = await response.json();
  
      const formattedDeadline = body.DEADLINE ? dayjs(body.DEADLINE).format('YYYY-MM-DD') : '';
      console.log(body);
      setPopupData(body); // Set the data for the popup
      setFormValues({
        NAME: body.NAME || '',
        LOCATION: body.LOCATION || '',
        LINK: body.LINK || '',
        AMOUNT: body.AMOUNT || '',
        ABOUT: body.ABOUT || '',
        FREE: body.FREE || '',
        ELIGIBILITY: body.ELIGIBILITY || '',
        DEADLINE: formattedDeadline || '',
        ID: body.ID || '',
      });
  
      // Open the modal for the current row
      setOpenModalFor(grant.ID);
  
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  const handleModalCancel = () => {
    // Close the modal
    if (isViewing) {
      setIsViewing(false);
      setSelectedGrant(null);
    } else {
      setOpenModalFor(null);
      setPopupData(null);
      setFormValues({
        NAME: '',
        LOCATION: '',
        LINK: '',
        AMOUNT: '',
        ABOUT: '',
        FREE: '',
        ELIGIBILITY: '',
        DEADLINE: '',
        ID: '',
      });
    }
    console.log('Modal closed');
  };

  useEffect(() => {
    if (!popupData) {
      setIsModalVisible(false); // Hide the modal if there is no data
    }
  }, [popupData]);

  useEffect(() => {
    if (popupData) {
      form.setFieldsValue({
        NAME: popupData.NAME || '',
        LOCATION: popupData.LOCATION || '',
        LINK: popupData.LINK || '',
        AMOUNT: popupData.AMOUNT ? parseInt(popupData.AMOUNT) : '',
        ABOUT: popupData.ABOUT || '',
        FREE: popupData.FREE || '',
        ELIGIBILITY: popupData.ELIGIBILITY || '',
        DEADLINE: popupData.DEADLINE || '',
        ID: popupData.ID || '',
      });
    }
  }, [popupData, form]);
  


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleDatePickerChange = (date, dateString, fieldName) => {
    setFormValues({ ...formValues, [fieldName]: dateString });
  };

  const handleModifyFormSubmit = async (values) => {
    const isDeadlineChanged =
    values.DEADLINE && dayjs(values.DEADLINE).format() !== dayjs(formValues.DEADLINE).format();

    // Include the 'deadline' field only if it has been changed
    delete values.DEADLINE;
    const deadlineToSubmit = isDeadlineChanged ? values.DEADLINE : formValues.DEADLINE;
    values.DEADLINE = deadlineToSubmit;
    values.ID = formValues.ID;
    try {
      const response = await fetch('/api/modifyGrantByID', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: [mode, values] }),
      });
      const body = await response.json();
      setGrants(body);
      setIsModalVisible(false);
      message.success('Grant modified successfully!');
    } catch(e){
      console.log("Error while modifying", e);
    }
    // Implement your form submission logic here
    console.log('Form submitted:', values );
  };

  const renderModalContent = () => {
    return (
      <div>
        {/* Form with pre-populated values */}
        {popupData && (
          <Form form={form} onFinish={handleModifyFormSubmit}>
            <div>
              <Form.Item
                label="Title"
                name="NAME"
                rules={[{ required: true, message: 'Please enter the title' },
                { max: 255, message: 'Title must be at most 255 characters' }]}
              >
                <Input value={formValues.NAME} onChange={handleInputChange} />
              </Form.Item>
            </div>
            <div>
              <Form.Item
                label="Location"
                name="LOCATION"
                rules={[{ required: false, message: 'Please enter the location' },
                { max: 255, message: 'Location must be at most 255 characters' }]}
              >
                <Input value={formValues.LOCATION} onChange={handleInputChange} />
              </Form.Item>
            </div>
            <div>
              <Form.Item
                label="Link"
                name="LINK"
                rules={[{ required: true, message: 'Please enter the link' },
                { max: 255, message: 'Link must be at most 255 characters' }]}
              >
                <Input value={formValues.LINK} onChange={handleInputChange} />
              </Form.Item>
            </div>
            <div>
            <Form.Item
              label="Amount"
              name="AMOUNT"
              rules={[
                { required: false, message: 'Please enter the amount' },
                { type: 'number', message: 'Amount must be a number' },
              ]}
            >
              <InputNumber
                value={formValues.AMOUNT}
                onChange={(value) => handleInputChange({ target: { name: 'AMOUNT', value } })}
              />
            </Form.Item>
            </div>
            <div>
              <Form.Item
                label="Description"
                name="ABOUT"
                rules={[{ required: false, message: 'Please enter the about information' },
                  { max: 4000, message: 'Description must be at most 4000 characters'}]}
              >
                <Input value={formValues.ABOUT} onChange={handleInputChange} />
              </Form.Item>
            </div>
            <Form.Item
              label="Free"
              name="FREE"
              rules={[{ required: false, message: 'Please select the free information' }]}
            >
              <Select
                value={formValues.FREE === null ? 'Unknown' : formValues.FREE}
                onChange={(value) => handleInputChange({ target: { name: 'FREE', value } })}
              >
                <Option value="Y">Yes</Option>
                <Option value="N">No</Option>
                <Option value="">Unknown</Option>
              </Select>
            </Form.Item>
            <div>
            <Form.Item
              label="Eligibility"
              name="ELIGIBILITY"
              rules={[{ required: false, message: 'Please enter the eligibility' }]}
            >
              <Select
                mode="tags"
                value={formValues.ELIGIBILITY}
                onChange={(values) => handleInputChange({ target: { name: 'ELIGIBILITY', value: values } })}
              >
                {/* Render existing tags as Options */}
                {formValues.ELIGIBILITY.map((tag) => (
                  <Option key={tag}>{tag}</Option>
                ))}
              </Select>
            </Form.Item>
            </div>
            <div>
              <Form.Item
                label="Deadline"
                name="deadline"
                rules={[{ required: false, message: 'Please select a deadline' }]}
              >
                <DatePicker
                  defaultValue={
                    formValues.DEADLINE ? dayjs(formValues.DEADLINE) : undefined
                  }
                  onChange={(date, dateString) =>
                    handleDatePickerChange(date, dateString, 'DEADLINE')
                  }
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form>
        )}
      </div>
    );
  };
  

  const handleAccept = async (grant, mode) => {
    try{
      await fetch('/api/addToDatabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grant),
      });
      const response = await fetch('/api/removeFromGrantQueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: [mode, grant.ID] }),
      });
      const body = await response.json();
      setGrants(body);
      message.success('Grant accepted successfully!');
    }catch(e){
      console.log("Error while moving grant")
    }

  }
  
  const columns = [
    {
      title: 'Title',
      dataIndex: 'NAME',
      key: 'name',
      className: 'title-column',
    },
    
    {
      title: 'Amount',
      dataIndex: 'AMOUNT',
      key: 'amount',
      className: 'amount-column',
    },
    {
      title: 'Deadline',
      dataIndex: 'DEADLINE',
      key: 'deadline',
      className: 'deadline-column',
      render: (deadline) => {
        // Format the date to show full month name, day, and full year
        return deadline ? moment(deadline).format('DD MMMM YYYY') : 'No deadline set';
      },
    },
    {
      title: 'Eligibility',
      dataIndex: 'ELIGIBILITY',
      key: 'eligibility',
      className: 'eligibility-column',
      render: (eligibility) => {
        return eligibility && eligibility.length > 0 ? eligibility.join(', ') : 'Not specified';
      },
    },
    ...(mode === "userQueue"
    ? [
        {
          title: 'Date Submitted',
          dataIndex: 'TIME',
          key: 'dateSubmitted',
          className: 'date-submitted-column',
          render: (date) => {
            return date ? moment(date).fromNow() : 'Time unavailable';
          },
        },
      ]
    : []),
    
    {
      title: 'Description',
      dataIndex: 'ABOUT',
      key: 'description',
      className: 'description-column',
    },
    {
      title: 'Actions',
      key: 'actions',
      className: 'actions-column',
      render: (text, record) => (
        <span>
          {<button className="row-button" onClick={() => handleView(record)}>All Info</button>}
          {mode === "userQueue" && <button className="row-button" onClick={() => handleAccept(record, mode)}>Accept</button>}
          {<button className="row-button" onClick={() => handleModify(record, mode)}>Modify</button>}
          {<button className="row-button" onClick={() => handleDelete(record, mode)}>Delete</button>}
        </span>
      ),
    },
  ];

  const handleView = (grant) => {
    setIsViewing(true);
    setSelectedGrant(grant);
  };

  const onRow = (record) => {
    const isExpanded = expandedRowKeys.has(record.ID);
  
    return {
      onClick: (event) => {
        const isButtonClick = event.target.tagName === 'BUTTON';
        if (!isModalVisible && !isButtonClick) {
          handleRowClick(record);
        }
      },
      className: isExpanded ? 'expanded-row' : '', // Add or remove the 'expanded-row' class
    };
  };
  
  const handleRowClick = (record) => {
    setExpandedRowKeys((prevExpandedRowKeys) => {
      const newExpandedRowKeys = new Set(prevExpandedRowKeys);
  
      if (newExpandedRowKeys.has(record.ID)) {
        newExpandedRowKeys.delete(record.ID); // Remove if already expanded
      } else {
        newExpandedRowKeys.add(record.ID); // Add if not expanded
      }
  
      return newExpandedRowKeys;
    });
  };
  


  const fetchGrants = async ( currentMode ) => {
    try {
      const response = await fetch(currentMode === "userQueue" ? '/api/getGrantQueue' : '/api/getMainGrantQueueWithID', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Grants data: ", data);
      setGrants(currentMode === "userQueue" ? data : data.express);
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  };

  const handleSubmit = async (values) => {
    const { uname, pass } = values;
   
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: [uname, pass] }),
      });

      if (!response.ok) {
        throw new Error('Network response failed.');
      }

      const body = await response.json();
      if(body.express.match_username && body.express.match_password) {
        setIsSubmitted(true);
        setErrorMessages({});
        setLoggedInUser(uname);
        await fetchGrants(mode);
      } else {
        setErrorMessages({
          name: body.express.match_username ? "pass" : "uname",
          message: body.express.match_username ? errors.pass : errors.uname
        });
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  };

  const handleModeToggle = async () => {
    const newMode = mode === "userQueue" ? "mainDatabase" : "userQueue";
    setMode(newMode);
    await fetchGrants(newMode);
  };

  const ExpandedGrantCard = ({ grant }) => {
    const filteredGrant = Object.fromEntries(
      Object.entries(grant).filter(([key]) => key !== 'ID' && key !== 'TIME')
    );
  
    return (
      <div className="expanded-card">
        {Object.entries(filteredGrant).map(([key, value]) => (
          <div key={key} className="grant-field">
            <span className="grant-field-name">{key}:</span>
            {key === 'ELIGIBILITY' ? (
              <div className="ellipsis-text">
                {value.map((eligibility, index) => (
                  <Tag key={index} className="tag">
                    {eligibility}
                  </Tag>
                ))}
              </div>
            ) : (
              <span className="grant-field-value ellipsis-text">{value}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const redirectToHome = () => {
    window.location.href = '/';
  };
  
  return (
    <div className="admin-page">
      {isSubmitted ? (
        <>
        <header className="admin-header">
            <div className="site-logo" onClick={redirectToHome}>
                EasyGrants admin
              </div>
                <nav className="action-buttons">
                  <Link to="/post-grant"><button>Post a Grant</button></Link>
                  <Dropdown overlay={menu}>
                  <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                    {loggedInUser} <UserOutlined />
                  </a>
                  </Dropdown>
                </nav>
          </header>
        <Layout style={{ minHeight: '100vh', minWidth: '100vw', paddingTop: '40px' }}>
          <Content className="admin-content">
          <div className="toggle-switch">
                <Switch
                  className="db-toggle"
                  checked={mode === "mainDatabase"}
                  onChange={handleModeToggle}
                  checkedChildren={<span style={{ color: '#1890ff' }}>Main Database</span>}
                  unCheckedChildren={<span style={{ color: '#1890ff' }}>User Queue</span>}
                  style={{ backgroundColor: mode === "mainDatabase" ? '#e6f7ff' : '#ffffff',
                          marginTop: '40px'
                        }}
                />
            </div>
            {isViewing && selectedGrant && (
              <Modal
                title={selectedGrant.NAME}
                visible={isViewing}
                onCancel={handleModalCancel}
                footer={null}
                
              >
                <ExpandedGrantCard grant={selectedGrant} />
              </Modal>
            )}
            {openModalFor !== null && (
              <Modal
                title={popupData ? `Modifying Grant: ${popupData.NAME}` : 'Modifying Grant'}
                visible={openModalFor !== null}
                onCancel={handleModalCancel}
                footer={null}
              >
                {renderModalContent()}
              </Modal>
            )}
            {grants.length > 0 ? (
              <Table dataSource={grants} columns={columns} rowKey="id" onRow={onRow} rowClassName="row"/>
            ) : (
              <Empty description="No user-submitted grants yet!" />
            )}
          </Content>
        </Layout>
        </>
      ) : (
        <>
        <header className="admin-header">
            <div className="site-logo" onClick={redirectToHome}>
                EasyGrants admin
              </div>
                <nav className="action-buttons">
                  <Link to="/post-grant"><button>Post a Grant</button></Link>
                </nav>
          </header>
        <div className="admin-signin-container admin-signin-background">
          <div className="admin-page-title">Sign In</div>
          <Form form={form} onFinish={handleSubmit} colon={false} className="login-form">
            <Form.Item
              data-testid="username-input"
              label={<label style={{ color: '#f5f5dc' }}>Username</label>}
              name="uname"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              data-testid="password-input"
              label={<label style={{ color: '#f5f5dc' }}>Password</label>}
              name="pass"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button data-tesid="submit" type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
            {errorMessages.name && (
              <Alert message={errorMessages.message} type="error" showIcon />
            )}
          </Form>
        </div>
        </>)}
    </div>
  );
  
}

export default AdminPage;