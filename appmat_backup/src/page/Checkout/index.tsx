import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonLoading
} from "@ionic/react";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";
import { createBill } from "@/services/payments";
import { createOrder } from "@/services/orders";
import PriceTag from "@/ui/PriceTag";

import "./checkout.css";

const Checkout = () => {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clear);

  const user = useUserStore((s) => s.user);

  const [name, setName] = useState(user?.email || "");
  const [email, setEmail] = useState(user?.email || "");

  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    setLoading(true);

    try {
      // 1) Create order in Supabase
      const order = await createOrder(user.id, items);

      // 2) Create Billplz bill
      const bill = await createBill(orderId, total, name, email);
      window.location.href = bill.url;

      // 3) Clear cart
      clearCart();

      // 4) Redirect user to payment page
      window.location.href = bill.url;
    } catch (err: any) {
      console.error(err);
      alert("Checkout failed. Please try again.");
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!user) {
      alert("You must login to checkout.");
    }
  }, [user]);

  return (
    <IonPage>
      {/* HEADER */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cart" />
          </IonButtons>
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* CONTENT */}
      <IonContent fullscreen className="checkout-container">
        <IonLoading isOpen={loading} message={"Processing..."} />

        <IonList>
          <IonItem>
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput
              value={name}
              onIonChange={(e) => setName(e.detail.value!)}
              placeholder="Enter your name"
            ></IonInput>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
              type="email"
              placeholder="your@email.com"
            ></IonInput>
          </IonItem>
        </IonList>

        

        {/* Summary */}
        <div className="summary-box">
          <h3>Order Summary</h3>

          {items.map((item) => (
            <div className="summary-row" key={item.id}>
              <span>
                {item.name} × {item.qty}
              </span>
              <span>RM {(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}

          <div className="summary-total">
            <strong>Total</strong>
            <PriceTag value={total} />
          </div>
        </div>

        <IonButton
          expand="block"
          color="primary"
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={items.length === 0}
        >
          Pay RM {total.toFixed(2)}
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Checkout;
