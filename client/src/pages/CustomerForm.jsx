import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';

const CustomerForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        products: []
    });
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [products, setProducts] = useState([
        { productName: '', quantity: 1 }
    ]);
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [orderSummary, setOrderSummary] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch user profile if logged in
        const token = localStorage.getItem('token');
        const userPhone = localStorage.getItem('userPhone'); // Save phone during login
        if (token && userPhone) {
            setProfileData({
                name: '',
                email: '',
                phone: userPhone,
            });
            setUserProfile({
                name: '',
                email: '',
                phone: userPhone,
            });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const orderData = {
            customerName: userProfile.name,
            phoneNumber: userProfile.phone,
            email: userProfile.email,
            address: formData.address,
            products: products.filter(p => p.productName.trim() !== ''),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const savedOrder = await response.json();
                setOrderSummary(orderData);
                localStorage.setItem('latestOrder', JSON.stringify(savedOrder));
                setSuccess(true);
                
                setTimeout(() => {
                    navigate('/orders');
                }, 2000);
            }
        } catch (error) {
            setError('Failed to submit order');
        }
    };

    const addProduct = () => {
        setProducts([...products, { productName: '', quantity: 1 }]);
    };

    const removeProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const updateProduct = (index, field, value) => {
        const newProducts = [...products];
        newProducts[index][field] = value;
        setProducts(newProducts);
    };

    const handleProfileUpdate = () => {
        setUserProfile(profileData);
        setIsEditing(false);
        // Add API call to update user profile
    };

    return (
        <>
            <UserNavbar />
            <div className="container mx-auto px-4 py-4 sm:py-8 mt-16">
                <div className="flex flex-col gap-4 sm:gap-8">
                    {/* Order Form - Full width on mobile */}
                    <div className="w-full bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Place Order</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {error && <div className="text-red-600 text-sm">{error}</div>}
                            
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                                {products.map((product, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
                                        <input
                                            type="text"
                                            placeholder="Product Name"
                                            className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-md"
                                            value={product.productName}
                                            onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-24 p-2 sm:p-3 border border-gray-300 rounded-md"
                                                value={product.quantity}
                                                onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(index)}
                                                className="p-2 text-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addProduct}
                                className="w-full border-2 border-dashed border-gray-300 p-3 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-500"
                            >
                                + Add Product
                            </button>

                            <textarea
                                placeholder="Delivery Address"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                rows="3"
                            />

                            <button 
                                type="submit"
                                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Place Order
                            </button>
                        </form>
                    </div>

                    {/* Profile Section - Full width on mobile */}
                    <div className="w-full bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Customer Profile</h2>
                            {userProfile && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        {userProfile ? (
                            <div className="space-y-4">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-500">Name</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-500">Email</label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        </div>
                                        <div className="border-b pb-4">
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="text-gray-900">{profileData.phone}</p>
                                        </div>
                                        <button
                                            onClick={handleProfileUpdate}
                                            className="w-full mt-4 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
                                        >
                                            Save Profile
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="border-b pb-4">
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="text-gray-900">{userProfile.name}</p>
                                        </div>
                                        <div className="border-b pb-4">
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="text-gray-900">{userProfile.email}</p>
                                        </div>
                                        <div className="border-b pb-4">
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="text-gray-900">{userProfile.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500">Please log in to view profile</p>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Summary - Adjusted padding for mobile */}
                {orderSummary && (
                    <div className="mt-4 sm:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                                Order placed successfully! You can view your order in the dashboard.
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="ml-4 text-blue-600 hover:text-blue-800"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
                                <div className="bg-gray-50 p-4 rounded">
                                    <p><span className="font-medium">Name:</span> {orderSummary.customerInfo.name}</p>
                                    <p><span className="font-medium">Email:</span> {orderSummary.customerInfo.email}</p>
                                    <p><span className="font-medium">Phone:</span> {orderSummary.customerInfo.phone}</p>
                                    <p><span className="font-medium">Delivery Address:</span> {orderSummary.address}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                                <div className="bg-gray-50 p-4 rounded">
                                    <ul className="space-y-2">
                                        {orderSummary.products.map((product, index) => (
                                            <li key={index} className="flex justify-between">
                                                <span>{product.productName}</span>
                                                <span className="font-medium">Qty: {product.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CustomerForm;