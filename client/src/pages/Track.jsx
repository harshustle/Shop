import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../Components/Navigation';

const Track = () => {
    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-green-200 flex flex-col items-center">
                {/* Track Order Header */}
                <div className="mt-8">
                    <button className="bg-black text-white font-bold text-lg px-6 py-3 rounded-lg shadow-md">
                        Track Order
                    </button>
                </div>

                {/* Timeline */}
                <div className="mt-8 w-full max-w-md">
                    <div className="flex flex-col m-8 justify-center items-start relative">
                        {/* Vertical Line */}
                        <div className="absolute  left-5 top-0 h-full w-1 bg-black"></div>

                        {/* Timeline Items */}
                        {['Shop', 'PickUp', 'On the Way', 'Delivered'].map((step, index) => (
                            <div key={index} className="flex items-center mb-8">
                                {/* Circle */}
                                <div className="w-8 h-8 bg-gray-500 text-white flex items-center justify-center rounded-full z-10">
                                    H
                                </div>
                                {/* Step Label */}
                                <div className="ml-4 bg-green-300 text-black px-4 py-2 rounded-md shadow-md">
                                    {step}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Request a Callback Button */}
                <div className="mt-20">
                    <button className="bg-green-800 text-white font-bold text-lg px-26 py-3 rounded-lg shadow-md hover:bg-green-900">
                       <Link to='/call'> REQ. A CALLBACK</Link>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Track;