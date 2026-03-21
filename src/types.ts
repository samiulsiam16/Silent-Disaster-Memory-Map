export type DisasterCategory = 'flood' | 'famine' | 'epidemic' | 'conflict' | 'environmental';

export interface Disaster {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  year: number;
  category: DisasterCategory;
  summary: string;
  survivorQuotes?: string[];
  historianNotes?: string;
  estimatedImpact?: string;
  photos?: string[];
  audioUrl?: string;
  credibility: 'verified' | 'historian' | 'oral' | 'unverified';
}

export interface MarkerProps {
  disaster: Disaster;
  onClick: (disaster: Disaster) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}
