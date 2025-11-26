import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon
} from "@ionic/react";

import { useEffect, useState } from "react";

import { getProductById } from "@/services/products";
import { useCartStore } from "@/store/cartStore";

import { add, remove, cartOutline } from "ionicons/icons";
import PriceTag from "@/ui/PriceTag";
import "./product-detail.css";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);

  const addCart = useCartStore((s) => s.add);

  async function load() {
    const res = await getProductById(id);
    setProduct(res);
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!product)
    return (
      <IonPage>
        <IonContent className="ion-padding">Loading...</IonContent>
      </IonPage>
    );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/products" />
          </IonButtons>
          <IonTitle>{product.name}</IonTitle>

          <IonButtons slot="end">
            <IonButton routerLink="/cart">
              <IonIcon icon={cartOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="product-detail-container">
        {/* Image */}
        <div className="product-image-wrapper">
          <img
            src={product.image || "/images/default-food.jpg"}
            alt={product.name}
            className="product-image"
          />
        </div>

        <div className="product-content">
          <h2 className="product-title">{product.name}</h2>

          <div className="price-row">
            <PriceTag value={product.price} />
          </div>

          {/* Quantity selector */}
          <div className="qty-selector">
            <IonButton fill="clear" onClick={() => qty > 1 && setQty(qty - 1)}>
              <IonIcon icon={remove} />
            </IonButton>

            <span className="qty-number">{qty}</span>

            <IonButton fill="clear" onClick={() => setQty(qty + 1)}>
              <IonIcon icon={add} />
            </IonButton>
          </div>

          {/* Description */}
          {product.description && (
            <p className="description">{product.description}</p>
          )}

          {/* Add to cart */}
          <IonButton
            expand="block"
            color="primary"
            className="add-cart-btn"
            onClick={() => {
              for (let i = 0; i < qty; i++) {
                addCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image
                });
              }
            }}
          >
            Add {qty} to Cart (RM {(product.price * qty).toFixed(2)})
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProductDetail;
