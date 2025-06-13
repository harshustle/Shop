import React from 'react';
import Navigation from '../Components/Navigation';

const Contact = () => {
    return (
        <>
            {/* Navigation Bar */}
            <Navigation />
            <div className="min-h-screen bg-green-200 flex flex-col items-center">
                {/* Contact Info Header */}
                <div className="mt-8">
                    <button className="bg-black text-white font-bold text-lg px-6 py-3 rounded-lg shadow-md">
                        Contact Info
                    </button>
                </div>

                {/* Contact Details */}
                <div className="mt-8 w-4/5 flex flex-col items-center space-y-4">
                    {/* Name */}
                    <div className="bg-green-800 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-md text-center">
                        Basti Kirana
                    </div>

                    {/* Phone Number */}
                    <div className="bg-green-800 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-md text-center">
                        9161955178
                    </div>

                    {/* Store Type */}
                    <div className="bg-green-800 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-md text-center">
                        General store
                    </div>

                    {/* Address */}
                    <div className="bg-gray-300 text-black font-bold text-lg px-6 py-3 rounded-lg shadow-md text-center">
                        MADDHESHIYA BUILDING, Basti Ho, Basti - 27200
                    </div>
                </div>
            </div>
        </>
    );
};

export default Contact;