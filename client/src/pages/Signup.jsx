import React from 'react';
import startBag from '../assets/startBag.jpg'



const Signup = () => {
    return (
        <div
            className="flex flex-col items-center gap-6 h-screen bg-cover bg-center p-4"
            style={{ backgroundImage: `url(${startBag})` }}
        >
            {/* Header */}
            <div className="bg-white  w-full py-4 mt-5 rounded-full shadow-md">
                    <h1 className="text-xl font-black text-center">BASTI KIRANA</h1> 
                </div>

            {/* Signup Form */}
            <div className="bg-gray-200 w-4/5 max-w-md p-6 rounded-lg shadow-lg">
                <h2 className="text-center text-2xl font-bold mb-5">Signup</h2>
                <form className="flex flex-col gap-4">
                    {/* First Name */}
                    <div>
                        <label className="block text-lg font-medium mb-2">First Name:</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-md bg-green-800 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                            placeholder="Enter your first name"
                        />
                    </div>
                    {/* Email */}
                    <div>
                        <label className="block text-lg font-medium mb-2">Email:</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 rounded-md bg-green-800 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                            placeholder="Enter your email"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-lg font-medium mb-2">Phone Number:</label>
                        <input
                            type="tel"
                            className="w-full px-4 py-2 rounded-md bg-green-800 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                            placeholder="Enter your phone number"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-lg font-medium mb-2">Password:</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-md bg-green-800 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-green-800 text-white font-black text-lg px-6 py-2 rounded-lg hover:bg-green-900 mt-4"
                    >
                        SIGN UP
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;