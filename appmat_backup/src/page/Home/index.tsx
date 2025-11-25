import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton
} from "@ionic/react";
import { useUserStore } from "@/store/userStore";
import "./home.css";

const Home = () => {
  const user = useUserStore((s) => s.user);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>AppMat</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="home-container">
        <div className="welcome-section">
          <h2>
            Hello{user ? `, ${user.email}` : ""}!  
          </h2>
          <p>Order makanan kegemaran anda. Fresh & cepat.</p>
        </div>

        <div className="highlight-banner">
          <img src="/images/banner1.jpg" alt="Promo" />
        </div>

        <div className="menu-button">
          <IonButton expand="block" routerLink="/products">
            Lihat Menu
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
