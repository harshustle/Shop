const Footer = () => {
  return (
    <footer className="bg-gray-50 py-4 px-4 mt-auto border-t">
      <p className="text-gray-600 text-center">
        &copy; {new Date().getFullYear()} Order Management System. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
