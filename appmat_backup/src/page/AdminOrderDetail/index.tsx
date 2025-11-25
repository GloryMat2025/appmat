import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from "@ionic/react";

import "./admin-order-detail.css";

import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { getAdminOrderDetail, updateOrderStatus } from "@/services/adminOrders";
import StatusBadge from "@/ui/StatusBadge";

const STATUS_FLOW = [
  "pending",
  "paid",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

await fetch(`${import.meta.env.VITE_PUSH_ENDPOINT}/order-status`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ order_id: orderId, status }),
});

const AdminOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");

  async function loadDetail() {
    setLoading(true);
    try {
      const data = await getAdminOrderDetail(id);
      setOrder(data);
      setNewStatus(data.status);
    } catch (err) {
      console.error(err);
      alert("Failed to load order detail (Admin)");
    }
    setLoading(false);
  }

  async function submitStatus() {
    if (!newStatus) return;

    try {
      const res = await updateOrderStatus(id, newStatus);

      alert("Status updated!");

      // reload again
      loadDetail();
    } catch (err) {
      console.error(err);
      alert("Failed to update order.");
    }
  }

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading || !order) {
    return (
      <IonPage>
        <IonContent className="admin-loading">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin/orders" />
          </IonButtons>
          <IonTitle>Order #{order.id.substring(0, 8)}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="admin-order-detail-container">
        {/* STATUS CARD */}
        <IonCard>
          <IonCardContent>
            <h2>Status</h2>
            <StatusBadge status={order.status} />

            {/* Timeline */}
            <div className="timeline-box">
              {order.order_status_history.map((s: any, i: number) => (
                <div className="timeline-item" key={i}>
                  <div
                    className={`dot ${
                      i === order.order_status_history.length - 1 ? "active" : ""
                    }`}
                  ></div>
                  <div className="timeline-text">
                    <strong>{s.status.toUpperCase()}</strong>
                    <p>{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* UPDATE STATUS */}
            <IonItem>
              <IonLabel>Status</IonLabel>
              <IonSelect
                value={newStatus}
                onIonChange={(e) => setNewStatus(e.detail.value)}
              >
                {STATUS_FLOW.map((s) => (
                  <IonSelectOption key={s} value={s}>
                    {s.toUpperCase()}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonButton expand="block" onClick={submitStatus}>
              Update Status
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* ITEMS */}
        <IonCard>
          <IonCardContent>
            <h2>Items</h2>
            {order.order_items.map((item: any, index: number) => (
              <div key={index} className="admin-item-row">
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    RM {item.price} × {item.qty}
                  </p>
                </div>
                <strong>
                  RM {(item.price * item.qty).toFixed(2)}
                </strong>
              </div>
            ))}
          </IonCardContent>
        </IonCard>

        {/* TOTAL */}
        <IonCard>
          <IonCardContent>
            <h2>Total</h2>
            <div className="admin-total-row">
              <span>Total Amount</span>
              <strong>RM {order.total.toFixed(2)}</strong>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default AdminOrderDetailPage;
