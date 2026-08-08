"use client";

import { useCallback, useEffect, useState } from "react";

const CLE_STOCKAGE = "criee-favoris";

export function useFavoris() {
  const [favoris, setFavoris] = useState<string[]>([]);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_STOCKAGE);
      if (brut) setFavoris(JSON.parse(brut));
    } catch {
      // localStorage indisponible (navigation privée stricte, etc.) : on
      // continue simplement sans persistance.
    } finally {
      setPret(true);
    }
  }, []);

  const basculer = useCallback((ticker: string) => {
    setFavoris((prev) => {
      const next = prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker];
      try {
        window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(next));
      } catch {
        // silencieux : le favori vivra le temps de la session en mémoire
      }
      return next;
    });
  }, []);

  const estFavori = useCallback((ticker: string) => favoris.includes(ticker), [favoris]);

  return { favoris, basculer, estFavori, pret };
}
