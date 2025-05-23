import { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
`;

const OrderList = styled.div`
  display: grid;
  gap: 1rem;
`;

const OrderCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.packed ? '#28a745' : '#007bff'};
  color: white;
  cursor: pointer;
`;

const AdminPanel = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const markAsPacked = async (orderId) => {
        try {
            await fetch(`http://localhost:3000/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    return (
        <Container>
            <h1>Order Management</h1>
            <OrderList>
                {orders.map(order => (
                    <OrderCard key={order._id}>
                        <h3>Customer: {order.customerName}</h3>
                        <p>Phone: {order.phoneNumber}</p>
                        <p>Address: {order.address}</p>
                        <p>Status: {order.status}</p>
                        <h4>Products:</h4>
                        <ul>
                            {order.products.map((product, index) => (
                                <li key={index}>
                                    {product.productName} - Qty: {product.quantity}
                                </li>
                            ))}
                        </ul>
                        <ButtonGroup>
                            {order.status === 'pending' && (
                                <Button onClick={() => markAsPacked(order._id)}>
                                    Mark as Packed
                                </Button>
                            )}
                        </ButtonGroup>
                    </OrderCard>
                ))}
            </OrderList>
        </Container>
    );
};

export default AdminPanel;