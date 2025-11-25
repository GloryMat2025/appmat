import { IonItem, IonLabel, IonButton, IonIcon } from "@ionic/react";
import { add, remove } from "ionicons/icons";
import { useCartStore } from "@/store/cartStore";

const CartItemRow = ({ item }: any) => {
  const increase = useCartStore((s) => s.increase);
  const decrease = useCartStore((s) => s.decrease);

  return (
    <IonItem>
      <IonLabel>
        <h2>{item.name}</h2>
        <p>RM {item.price.toFixed(2)}</p>
      </IonLabel>

      <IonButton fill="clear" onClick={() => decrease(item.id)}>
        <IonIcon icon={remove} />
      </IonButton>

      <span>{item.qty}</span>

      <IonButton fill="clear" onClick={() => increase(item.id)}>
        <IonIcon icon={add} />
      </IonButton>
    </IonItem>
  );
};

export default CartItemRow;
