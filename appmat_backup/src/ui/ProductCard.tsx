import { IonCard, IonCardContent, IonImg } from "@ionic/react";
import { useHistory } from "react-router-dom";

interface Props {
  product: any;
}

const ProductCard = ({ product }: Props) => {
  const history = useHistory();

  return (
    <IonCard
      className="product-card"
      button
      onClick={() => history.push(`/product/${product.id}`)}
    >
      <IonImg
        src={product.image || "/images/default-food.jpg"}
        className="product-image"
      />

      <IonCardContent>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">RM {product.price.toFixed(2)}</p>
      </IonCardContent>
    </IonCard>
  );
};

export default ProductCard;
