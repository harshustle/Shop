import { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  background: white;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.8rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background: #0056b3;
  }
`;

const Error = styled.div`
  color: #dc3545;
  margin-bottom: 1rem;
`;

const CustomerForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Handle form submission logic
    };

    return (
        <FormContainer>
            <Form onSubmit={handleSubmit}>
                <h2>Customer Form</h2>
                {error && <Error>{error}</Error>}
                <Input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
                <Input
                    type="text"
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
                <Button type="submit">Submit</Button>
            </Form>
        </FormContainer>
    );
};

export default CustomerForm;