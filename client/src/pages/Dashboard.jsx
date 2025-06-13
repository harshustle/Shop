import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentOrders = async () => {
      const token = localStorage.getItem('token');
      const userPhone = localStorage.getItem('userPhone');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        console.log('Fetching orders for:', userPhone); // Debug log
        const response = await fetch(`http://localhost:3000/api/orders/user/${userPhone}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        console.log('Fetched orders:', data); // Debug log

        if (data && Array.isArray(data)) {
          const sortedOrders = data
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          setRecentOrders(sortedOrders);
          if (data.length > 0) {
            setLatestOrder(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    // Check for new order first
    const savedOrder = localStorage.getItem('latestOrder');
    if (savedOrder) {
      const parsedOrder = JSON.parse(savedOrder);
      setLatestOrder(parsedOrder);
      setRecentOrders(prev => [parsedOrder, ...prev].slice(0, 3));
      localStorage.removeItem('latestOrder');
    }

    fetchRecentOrders();
  }, [navigate]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'text-yellow-600';
      case 'packed': return 'text-blue-600';
      case 'out_for_delivery': return 'text-orange-600';
      case 'delivered': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').toUpperCase();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="min-h-screen bg-gray-50 pt-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Dashboard</h1>
          
          {/* Quick Actions Section - Moved to top */}
          <div className="mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Create New Order
                  </button>
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View My Orders
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="space-y-4 sm:space-y-6">
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Order Details
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs sm:text-sm rounded-full ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <p><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p><span className="font-medium">Delivery Address:</span> {order.address}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <h4 className="font-medium mb-2">Ordered Items:</h4>
                        <ul className="space-y-2">
                          {order.products.map((product, index) => (
                            <li key={index} className="flex justify-between text-sm">
                              <span>{product.productName}</span>
                              <span className="font-medium">x{product.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">No orders found</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Place Your First Order
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
