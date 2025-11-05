import PropTypes from 'prop-types';

export default function ProductCard({ title, price, image, onClick }) {
  return (
    <div className="border p-4 rounded-md cursor-pointer" onClick={onClick}>
      <img src={image} alt={title} className="w-full h-40 object-cover mb-2 rounded-md" />
      <h3 className="font-semibold">{title}</h3>
      <p>RM {price.toFixed(2)}</p>
    </div>
  );
}

ProductCard.propTypes = {
  title: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  image: PropTypes.string,
  onClick: PropTypes.func,
};
