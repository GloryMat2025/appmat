import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel
} from "@ionic/react";

import { useCartStore } from "@/store/cartStore";
import CartItemRow from "@/ui/CartItemRow";
import PriceTag from "@/ui/PriceTag";
import "./cart.css";

const CartPage = () => {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);

  return (
    <IonPage>
      {/* HEADER */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/products" />
          </IonButtons>
          <IonTitle>Cart</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* CONTENT */}
      <IonContent fullscreen className="cart-container">
        {items.length === 0 ? (
          <div className="empty-cart">
            <img src="/images/empty-cart.png" alt="Empty" />
            <h3>Your cart is empty</h3>
            <p>Let's add something tasty.</p>
            <IonButton routerLink="/products" expand="block">
              Browse Menu
            </IonButton>
          </div>
        ) : (
          <>
            {/* CART ITEM LIST */}
            <IonList>
              {items.map((item) => (
                <CartItemRow item={item} key={item.id} />
              ))}
            </IonList>

            {/* TOTAL SECTION */}
            <div className="cart-total-box">
              <div className="total-row">
                <span>Total</span>
                <PriceTag value={total} />
              </div>

              <IonButton
                expand=
