import { IonCard, IonSkeletonText, IonCardContent } from "@ionic/react";

const ProductSkeleton = () => {
  return (
    <IonCard>
      <IonSkeletonText animated style={{ width: "100%", height: "120px" }} />
      <IonCardContent>
        <IonSkeletonText animated style={{ width: "60%", height: "14px" }} />
        <IonSkeletonText animated style={{ width: "40%", height: "12px", marginTop: "8px" }} />
      </IonCardContent>
    </IonCard>
  );
};

export default ProductSkeleton;
