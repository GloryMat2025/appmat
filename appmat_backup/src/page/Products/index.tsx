import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol
} from "@ionic/react";

import { useEffect, useState } from "react";
import { getProducts } from "@/services/products";
import ProductCard from "@/ui/ProductCard";
import ProductSkeleton from "@/ui/Skeletons/ProductSkeleton";

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await getProducts();
    setProducts(res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => {
          load().then(() => e.detail.complete());
        }}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <IonGrid>
            <IonRow>
              {[1,2,3,4].map((x) => (
                <IonCol size="6" key={x}>
                  <ProductSkeleton />
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : (
          <IonGrid>
            <IonRow>
              {products.map((p) => (
                <IonCol size="6" key={p.id}>
                  <ProductCard product={p} />
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Products;
