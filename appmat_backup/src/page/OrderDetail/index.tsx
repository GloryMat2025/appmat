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
} from "@ionic/react";

import { useEffect, useState } from "react";
import { getOrderDetail } from "@/services/orders";
import StatusBadge from "@/ui/StatusBadge";

import "./order-detail.css";
import { useParams } from "react-router";

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadDetail() {
    try {
      const data = await getOrderDetail(id);
      setOrder(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load order detail.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading || !order) return null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/orders" />
          </IonButtons>
          <IonTitle>Order #{order.id.substring(0, 8)}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="order-detail-container">
        {/* STATUS */}
        <IonCard>
          <IonCardContent>
            <h2 className="status-title">Status</h2>
            <StatusBadge status={order.status} />

            <div className="timeline-box">
              {order.order_status_history.map((s: any, i: number) => (
                <div key={i} className="timeline-item">
                  <div className={`dot ${i === order.order_status_history.length - 1 ? "active" : ""}`}></div>
                  <div className="timeline-text">
                    <strong>{s.status.toUpperCase()}</strong>
                    <p>{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </IonCardContent>
        </IonCard>

        {/* ITEMS */}
        <IonCard>
          <IonCardContent>
            <h2 classN
