import { IonButton } from "@ionic/react";
import { useCartStore } from "@/store/cartStore";

const AddToCartButton = ({ product }: any) => {
  const add = useCartStore((s) => s.add);

  return (
    <IonButton
      expand="block"
      color="primary"
      onClick={() =>
        add({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image
        })
      }
    >
      + Add to Cart
    </IonButton>
  );
};

export default AddToCartButton;
