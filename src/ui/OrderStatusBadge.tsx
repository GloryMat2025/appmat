import { IonBadge } from "@ionic/react";

const colorMap: Record<string, string> = {
  pending: "medium",
  paid: "success",
  preparing: "warning",
  delivering: "tertiary",
  completed: "primary",
  cancelled: "danger"
};

const OrderStatusBadge = ({ status }: { status: string }) => {
  return (
    <IonBadge color={colorMap[status] || "medium"}>
      {status.toUpperCase()}
    </IonBadge>
  );
};

export default OrderStatusBadge;
