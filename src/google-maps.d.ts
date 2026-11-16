/* Minimal TypeScript ambient types for Google Maps JS API v3 + Places (New) + AdvancedMarker */
declare namespace google {
  namespace maps {
    namespace marker {
      interface AdvancedMarkerElement {
        position?: { lat: number; lng: number } | null;
      }
    }
    namespace places {
      class AutocompleteSessionToken {}
      interface Place {
        displayName?: string | null;
        formattedAddress?: string | null;
        location?: {
          lat: () => number;
          lng: () => number;
        } | null;
        fetchFields: (opts: { fields: string[] }) => Promise<{ place: Place }>;
      }
      interface AutocompleteSuggestion {
        placePrediction?: {
          text: { text: string };
          toPlace: () => Place;
        };
      }
    }
  }
}
