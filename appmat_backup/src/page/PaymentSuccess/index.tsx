import { IonPage, IonContent, IonButton } from "@ionic/react";
import { useSearchParams } from "react-router-dom";

const PaymentSuccess = () => {
  const [params] = useSearchParams();

  const orderId = params.get("order");

  return (
    <IonPage>
      <IonContent className="success-container">
        <img src="/assets/success.png" width="160" />
        <h2>Payment Successful!</h2>
        <p>Your order is now paid.</p>

        <IonButton routerLink={`/orders/${orderId}`} expand="block">
          View Order
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default PaymentSuccess;
