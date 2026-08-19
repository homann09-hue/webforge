export type SiteConfig = {
  slug: string; business: string; category: string; tagline: string; headline: string; intro: string;
  phone: string; email: string; address: string; hours: string; accent: string;
  services: { title: string; text: string; price?: string }[];
  highlights: string[]; cta: string;
};

export const sites: Record<string, SiteConfig> = {
  handwerk: {
    slug: "handwerk", business: "Nordwerk Dach & Bau", category: "Meisterbetrieb · Region Hildesheim",
    tagline: "Handwerk, das hält.", headline: "Starke Dächer. Saubere Arbeit. Ein Ansprechpartner.",
    intro: "Von der Reparatur bis zur kompletten Dachsanierung: zuverlässig geplant, sauber ausgeführt und verständlich erklärt.",
    phone: "05121 000000", email: "anfrage@nordwerk-demo.de", address: "Musterstraße 12 · 31134 Hildesheim", hours: "Mo–Fr · 07:00–17:00", accent: "#d9ff43",
    services: [{title:"Dachsanierung",text:"Komplette Sanierung mit sauberer Planung und transparenter Ausführung."},{title:"Reparatur & Wartung",text:"Schnelle Hilfe bei Schäden, Undichtigkeiten und Verschleiß."},{title:"Dachfenster",text:"Mehr Licht und Wohnkomfort inklusive fachgerechtem Einbau."}],
    highlights:["Persönlicher Ansprechpartner","Klare Angebote","Regional & zuverlässig"], cta:"Kostenlose Erstberatung anfragen"
  },
  gastro: {
    slug: "gastro", business: "Forno 37", category: "Pizza · Pasta · Hildesheim",
    tagline: "Heiß. Frisch. Direkt.", headline: "Pizza, die nicht bis zur Haustür langweilig wird.",
    intro: "Frischer Teig, starke Zutaten und unkomplizierte Bestellung. Entdecke unsere Favoriten oder stell dir deine Pizza selbst zusammen.",
    phone: "05121 111111", email: "ciao@forno37-demo.de", address: "Markt 37 · 31134 Hildesheim", hours: "Di–So · 16:00–23:00", accent: "#ff6b3d",
    services: [{title:"Pizza Burrata",text:"Tomate, Fior di Latte, Burrata, Basilikum",price:"13,90 €"},{title:"Pizza Inferno",text:"Tomate, Mozzarella, scharfe Salami, Chili, Honig",price:"12,90 €"},{title:"Pasta Verde",text:"Pesto, Parmesan, Kirschtomaten, Rucola",price:"11,90 €"}],
    highlights:["Frisch zubereitet","Abholung & Lieferung","Toppings frei wählbar"], cta:"Jetzt Bestellung anfragen"
  }
};

export function getSite(slug: string) { return sites[slug]; }