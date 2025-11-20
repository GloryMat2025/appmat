import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonList,
  IonLabel,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonButton,
  IonSpinner,
} from "@ionic/react";

import { useEffect, useState } from "react";
import { getAllOrders } from "@/services/adminOrders";
import StatusBadge from "@/ui/StatusBadge";

import "./admin-orders.css";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "paid",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadOrders() {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load Admin Orders");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.id.toLower
