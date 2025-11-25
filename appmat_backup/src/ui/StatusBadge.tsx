import { IonBadge } from "@ionic/react";

const colors: any = {
  pending: "medium",
  paid: "success",
  preparing: "warning",
  delivering: "primary",
  completed: "success",
  cancelled: "danger",
};

const StatusBadge = ({ status }: { status: string }) => {
  return (
    <IonBadge color={colors[status] || "medium"}>
      {status.toUpperCase()}
    </IonBadge>
  );
};

export default StatusBadge;
