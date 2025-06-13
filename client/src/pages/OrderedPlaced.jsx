import React from 'react';
import { Link } from 'react-router-dom';
import startBag from '../assets/startBag.jpg'; // Import the image
import Navigation from '../Components/Navigation';

const OrderedPlaced = () => {
    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-green-200 flex flex-col items-center ">
                {/* Order Placed Button */}
                <div className="mt-8">
                    <button className="bg-green-500 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-md hover:bg-green-900">
                        ORDER PLACED
                    </button>
                </div>

                {/* Image */}
                <div className="mt-8">
                    <div className="bg-white rounded-lg shadow-md mb-8 p-4">
                        <img
                            src={startBag} // Use the imported image
                            alt="Order Placed"
                            className="w-full h-90 rounded-lg"
                        />
                    </div>
                </div>

                {/* Order Detail Button */}
                <div className="mt-8">
                    <Link
                        to="/orderdetail" // Replace with your route
                        className="bg-green-800 text-white font-bold text-lg px-24 py-3 rounded-lg shadow-md hover:bg-green-900"
                    >
                        ORDER DETAIL
                    </Link>
                </div>

                {/* Track Order Button */}
                <div className="my-8">
                    <Link
                        to="/track" // Replace with your route
                        className="bg-green-800 text-white font-bold text-lg px-24 py-3 rounded-lg shadow-md hover:bg-green-900"
                    >
                        TRACK ORDER
                    </Link>
                </div>
            </div>
        </>
    );
};

export default OrderedPlaced;