import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';

const UserOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const userPhone = localStorage.getItem('userPhone');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/orders/user/${userPhone}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                setIsLoading(false);
            } catch (error) {
                console.error('Error:', error);
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [userPhone]);

    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return 'text-yellow-600';
            case 'packed': return 'text-blue-600';
            case 'out_for_delivery': return 'text-orange-600';
            case 'delivered': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <>
            <DashboardNavbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Place New Order
                        </button>
                    </div>
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <h3 className="text-lg font-semibold">Order Details</h3>
                                            <span className={`${getStatusColor(order.status)}`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded">
                                            <p><span className="font-medium">Date: </span> 
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                            <p><span className="font-medium">Address: </span> 
                                                {order.address}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Products</h3>
                                        <div className="bg-gray-50 p-4 rounded">
                                            <ul className="space-y-2">
                                                {order.products.map((product, index) => (
                                                    <li key={index} className="flex justify-between">
                                                        <span>{product.productName}</span>
                                                        <span>Qty: {product.quantity}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserOrders;
