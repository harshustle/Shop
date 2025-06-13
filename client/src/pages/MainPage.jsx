import React from 'react';
import TaskManager from './TaskManager';
import { Link } from 'react-router-dom';

const MainPage = () => {
    return (
        <div className="flex flex-col items-center min-h-[95vh] bg-gradient-to-b from-gray-700 to-gray-900 p-4">
            {/* Header */}
            <div className="bg-white px-6 py-2 mt-5 rounded-full shadow-md flex justify-between items-center w-full max-w-md">
                <h1 className="text-xl font-black text-center">BASTI KIRANA</h1>
                <button className="text-black text-2xl font-bold">☰</button>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4 mt-10 w-full max-w-md">
                <button className="bg-green-800 text-white font-medium text-lg px-6 py-3 rounded-lg hover:bg-green-900">
                    Contact Info
                </button>
                <button className="bg-green-800 text-white font-medium text-lg px-6 py-3 rounded-lg hover:bg-green-900">
                    Previous Order
                </button>
                <button className="bg-gray-400 text-gray-500 font-medium text-lg px-6 py-3 rounded-lg hover:bg-green-900 " >
                    Month Stock
                </button>
                <button className="bg-green-800 text-white font-medium text-lg px-6 py-3 rounded-lg hover:bg-green-900">
                    <Link to='/track' className='px-30'>Track Order</Link>
                </button>
                <button className="bg-green-900 text-white font-medium text-lg px-6 py-4 rounded-full mt-10 border-2 border-green-700 shadow-lg hover:bg-green-700 hover:text-black transition-all duration-300">
                    <Link to='/taskmanager' className='px-30'>
                    Order Now</Link>
                </button>
            </div>

            {/* Footer Button */}
            <div className="mt-auto mb-10 w-full max-w-md">
                <button  className="bg-green-800 text-white font-black text-lg px-6 py-3 rounded-lg hover:bg-green-900 w-full">
                    <Link to='/call' className='px-22'>REQ. A CALLBACK</Link>
                </button>
            </div>
        </div>);
};

export default MainPage;