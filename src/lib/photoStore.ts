import { useState, useCallback, useEffect } from "react";

export interface SitePhoto {
  dataUrl: string;
  caption: string;
}

type Listener = () => void;

class PhotoStore {
  private photos: Record<string, SitePhoto[]> = {};
  private listeners: Set<Listener> = new Set();

  getPhotos(siteId: string): SitePhoto[] {
    if (!this.photos[siteId]) this.photos[siteId] = [];
    return this.photos[siteId];
  }

  addPhoto(siteId: string, dataUrl: string, caption = "") {
    if (!this.photos[siteId]) this.photos[siteId] = [];
    this.photos[siteId] = [...this.photos[siteId], { dataUrl, caption }];
    this.notify();
  }

  updateCaption(siteId: string, index: number, caption: string) {
    if (this.photos[siteId]?.[index]) {
      this.photos[siteId] = this.photos[siteId].map((p, i) => i === index ? { ...p, caption } : p);
      this.notify();
    }
  }

  removePhoto(siteId: string, index: number) {
    if (this.photos[siteId]) {
      this.photos[siteId] = this.photos[siteId].filter((_, i) => i !== index);
      this.notify();
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const photoStore = new PhotoStore();

export function useSitePhotos(siteId: string): [SitePhoto[], (file: File) => void, (index: number) => void, (index: number, caption: string) => void] {
  const [photos, setPhotos] = useState<SitePhoto[]>(() => photoStore.getPhotos(siteId));

  useEffect(() => {
    setPhotos(photoStore.getPhotos(siteId));
    const unsub = photoStore.subscribe(() => {
      setPhotos(photoStore.getPhotos(siteId));
    });
    return () => { unsub(); };
  }, [siteId]);

  const addPhoto = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        photoStore.addPhoto(siteId, reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, [siteId]);

  const removePhoto = useCallback((index: number) => {
    photoStore.removePhoto(siteId, index);
  }, [siteId]);

  const updateCaption = useCallback((index: number, caption: string) => {
    photoStore.updateCaption(siteId, index, caption);
  }, [siteId]);

  return [photos, addPhoto, removePhoto, updateCaption];
}
