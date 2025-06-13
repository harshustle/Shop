import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

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

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            await fetchOrders(); // Refresh orders after successful update
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order status');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return 'text-yellow-600';
            case 'packed': return 'text-blue-600';
            case 'out_for_delivery': return 'text-orange-600';
            case 'delivered': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
                                    <div className="bg-gray-50 p-4 rounded">
                                        <p><span className="font-medium">Name:</span> {order.customerName}</p>
                                        <p><span className="font-medium">Email:</span> {order.email}</p>
                                        <p><span className="font-medium">Phone:</span> {order.phoneNumber}</p>
                                        <p><span className="font-medium">Address:</span> {order.address}</p>
                                        <p className="mt-2">
                                            <span className="font-medium">Status: </span>
                                            <span className={`${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                                    <div className="bg-gray-50 p-4 rounded">
                                        <ul className="space-y-2">
                                            {order.products.map((product, index) => (
                                                <li key={index} className="flex justify-between">
                                                    <span>{product.productName}</span>
                                                    <span className="font-medium">Qty: {product.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {order.status === 'pending' && (
                                        <button
                                            onClick={() => updateOrderStatus(order._id, 'packed')}
                                            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Mark as Packed
                                        </button>
                                    )}
                                    {order.status === 'packed' && (
                                        <button
                                            onClick={() => updateOrderStatus(order._id, 'out_for_delivery')}
                                            className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                                        >
                                            Mark Out for Delivery
                                        </button>
                                    )}
                                    {order.status === 'out_for_delivery' && (
                                        <button
                                            onClick={() => updateOrderStatus(order._id, 'delivered')}
                                            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Mark as Delivered
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;