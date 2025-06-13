import AdminNavbar from './Navbar';
import UserNavbar from './UserNavbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const isAdminRoute = window.location.pathname.includes('/admin') ||
    window.location.pathname.includes('/dashboard');

  const hideNavbarRoutes = ['/login', '/register'];
  const shouldHideNavbar = hideNavbarRoutes.includes(window.location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!shouldHideNavbar && (isAdminRoute ? <AdminNavbar /> : <UserNavbar />)}
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
