import React from 'react';
import Navigation from '../Components/Navigation';

const ListingPage = () => {
  return (
    <>
    <Navigation/>
    <div className="flex flex-col items-center min-h-[95vh] bg-gradient-to-b from-gray-700 to-gray-900 p-4">

      {/* Title */}
      <h2 className="text-white text-lg font-medium mt-6">Make a list of your product</h2>

      {/* Input and Add Button */}
      <div className="flex flex-col gap-4 mt-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Enter product name"
          className="w-full px-4 py-2 rounded-md bg-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <button className="bg-green-800 text-white font-medium text-lg px-6 py-2 rounded-lg hover:bg-green-900">
          Add
        </button>
      </div>

      {/* Search Bar */}
      <div className="mt-6 w-full max-w-md">
        <input
          type="text"
          placeholder="| Search product"
          className="w-full px-4 py-2 rounded-md bg-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* List Section */}
      <div className="mt-6 w-full max-w-md bg-green-900 p-4 rounded-lg shadow-lg">
        <h3 className="text-white text-lg font-medium mb-4 text-center">List</h3>
        <div className="flex flex-col gap-2">
          {/* Placeholder for list items */}
          <div className="bg-gray-300 px-4 py-2 rounded-md"></div>
          <div className="bg-gray-300 px-4 py-2 rounded-md"></div>
          <div className="bg-gray-300 px-4 py-2 rounded-md"></div>
          <div className="bg-gray-300 px-4 py-2 rounded-md"></div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="mt-6 w-full max-w-md">
        <button className="bg-green-800 text-white font-black text-lg px-6 py-3 rounded-lg hover:bg-green-900 w-full">
          PLACE ORDER
        </button>
      </div>
    </div></>
  );
};

export default ListingPage;