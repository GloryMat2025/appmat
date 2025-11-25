import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
} from "@ionic/react";

import { useEffect, useState } from "react";
import { getOrders } from "@/services/orders";
import { useUserStore } from "@/store/userStore";
import StatusBadge from "@/ui/StatusBadge";

import "./orders.css";

const OrdersPage = () => {
  const user = useUserStore((s) => s.user);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    if (!user) return;

    try {
      const list = await getOrders(user.id);
      setOrders(list);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [user]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>My Orders</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="orders-container">
        {loading && (
          <div className="loading-box">
            <IonSpinner name="dots" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="empty-orders">
            <img src="/assets/empty-order.png" alt="Empty" />
            <p>No orders yet.</p>
          </div>
        )}

        <IonList>
          {orders.map((order) => (
            <IonItem
              key={order.id}
              button
              routerLink={`/orders/${order.id}`}
            >
              <IonLabel>
                <h2>Order #{order.id.substring(0, 8)}</h2>
                <p>{new Date(order.created_at).toLocaleString()}</p>
                <p>Total: RM {order.total.toFixed(2)}</p>
              </IonLabel>

              <StatusBadge status={order.status} />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default OrdersPage;
