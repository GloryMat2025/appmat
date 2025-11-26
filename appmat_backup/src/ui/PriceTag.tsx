const PriceTag = ({ value }: { value: number }) => {
  return <div style={{ fontWeight: 700 }}>RM {value.toFixed(2)}</div>;
};

export default PriceTag;
