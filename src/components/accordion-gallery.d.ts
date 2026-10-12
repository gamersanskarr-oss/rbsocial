declare module "@/components/accordion-gallery" {
  export interface AccordionGalleryItem {
    image: string;
    label: string;
    alt?: string;
    link?: string;
  }

  export interface AccordionGalleryProps {
    items?: AccordionGalleryItem[];
    defaultIndex?: number;
    accentColor?: string;
    overlayColor?: string;
    textColor?: string;
    height?: number;
    gap?: number;
    radius?: number;
    expandRatio?: number;
    orientation?: "horizontal" | "vertical";
    duration?: number;
    ease?: string;
    parallax?: number;
    tilt?: number;
    stagger?: number;
    trigger?: "hover" | "click";
    showLabels?: boolean;
    grayscale?: boolean;
    className?: string;
  }

  const AccordionGallery: (props: AccordionGalleryProps) => JSX.Element;
  export default AccordionGallery;
}
