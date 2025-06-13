import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../Components/Navigation';

const OrderDetail = () => {
    return (
        <>
            {/* Navigation Bar */}
            <Navigation />
            <div className="min-h-screen bg-green-200 flex flex-col items-center">
                {/* Order Detail Button */}
                <div className="mt-8">
                    <button className="bg-black text-white font-bold text-lg px-6 py-3 rounded-lg shadow-md">
                        ORDER DETAIL
                    </button>
                </div>

                {/* List Section */}
                <div className="mt-8 w-4/5 bg-black rounded-lg shadow-md p-4">
                    <h2 className="text-white font-bold text-lg mb-4 text-center">List</h2>
                    <div className="bg-gray-300 rounded-lg p-4 mb-4"></div>
                    <div className="bg-gray-300 rounded-lg p-4 mb-4"></div>
                    <div className="bg-gray-300 rounded-lg p-4 mb-4"></div>
                    <div className="bg-gray-300 rounded-lg p-4"></div>
                </div>

                {/* Request a Callback Button */}
                <div className="mt-28">
                    <Link
                        to="/call"
                        className="bg-green-800  text-white font-bold text-lg px-26 py-3 rounded-lg shadow-md hover:bg-green-900"
                    >
                        REQ. A CALLBACK
                    </Link>
                </div>
            </div>
        </>
    );
};

export default OrderDetail;