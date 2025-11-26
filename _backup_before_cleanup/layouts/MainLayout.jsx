import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropTypes from 'prop-types';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node,
};

MainLayout.defaultProps = {
  children: null,
};
