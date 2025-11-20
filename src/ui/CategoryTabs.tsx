import { IonSegment, IonSegmentButton, IonLabel } from "@ionic/react";

const CategoryTabs = ({ categories, selected, onChange }: any) => {
  return (
    <IonSegment
      value={selected}
      onIonChange={(e) => onChange(e.detail.value)}
      scrollable
    >
      {categories.map((cat: any) => (
        <IonSegmentButton value={cat.id} key={cat.id}>
          <IonLabel>{cat.name}</IonLabel>
        </IonSegmentButton>
      ))}
    </IonSegment>
  );
};

export default CategoryTabs;
