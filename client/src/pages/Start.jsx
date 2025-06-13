import React from 'react';
import startBag from '../assets/startBag.jpg'
import { Link } from 'react-router-dom';

const Start = () => {
    return (
        <>
            <div
                className="flex flex-col items-center justify-between h-screen bg-gray-100 p-4"
                style={{
                    backgroundImage: `url(${startBag})`, // Set the background image
                    backgroundSize: 'cover', // Make the image cover the entire container
                    backgroundPosition: 'center', // Center the image
                    backgroundRepeat: 'no-repeat', // Prevent the image from repeating
                }}>
                {/* Header */}
                <div className="bg-white  w-full py-4 mt-5 rounded-full shadow-md">
                    <h1 className="text-xl font-black text-center">BASTI KIRANA</h1> 
                </div>



                {/* Buttons */}
                <div className="flex gap-5 py-12 px-8 mb-15">
                    <button className="bg-green-800  text-white font-black text-lg px-12 py-6 rounded-lg hover:bg-green-900" >
                        <Link to='/signup'>Sign Up</Link>
                    </button>
                    <button className="bg-green-800 text-white font-black text-lg px-12 py-2 rounded-lg hover:bg-green-900">
                        <Link to='/login'>Login</Link>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Start;