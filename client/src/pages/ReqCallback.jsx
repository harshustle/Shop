import React from 'react';
import Navigation from '../Components/Navigation';

const ReqCallback = () => {
    return (
        <>
            {/* Navigation Bar */}
            <Navigation />
            <div className="min-h-screen bg-green-200 flex py-20 flex-col items-center">
                {/* Response Box */}
                <div className="mt-16 bg-gray-300 w-4/5 h-64 flex items-center justify-center rounded-lg shadow-md">
                    <p className="text-black font-bold text-xl text-center">
                        WAIT FOR THE RESPONSE
                    </p>
                </div>

                {/* Report Callback Button */}
                <div className="mt-16 py-10">
                    <button className="bg-green-800 text-white font-bold text-lg px-26 py-3 rounded-lg shadow-md hover:bg-green-900">
                        REPORT CALLBACK
                    </button>
                </div>
            </div>
        </>
    );
};

export default ReqCallback;