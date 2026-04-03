import { useState, useRef } from 'react';

export function useDragDrop({ planPois, setPlanPois, selectedId }) {
  const [draggedPoi, setDraggedPoi] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const previousStateRef = useRef(null);

  const handleDragStart = (poi, e) => {
    setDraggedPoi(poi);
    setDragActive(true);
    e.dataTransfer.effectAllowed = 'move';
    
    // Sauvegarder l'état précédent pour rollback
    previousStateRef.current = [...planPois];
  };

  const handleDragEnd = () => {
    setDraggedPoi(null);
    setDragOverDay(null);
    setDragOverIndex(null);
    setDragActive(false);
  };

  const handleDragOver = (e, day = null, index = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
    setDragOverIndex(null);
  };

  const updatePoiPosition = async (poiId, day, position) => {
    try {
      const response = await fetch(`http://localhost:8000/itineraire/${selectedId}/poi/${poiId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, position })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur mise à jour POI:', error);
      return false;
    }
  };

  const handleDropOnDay = async (e, targetDay) => {
    e.preventDefault();
    setDragOverDay(null);
    setDragOverIndex(null);
    
    if (!draggedPoi) return;

    const sourceDay = draggedPoi.day || 0;
    const targetDayNum = targetDay || 0;
    
    // No-op si même position
    if (sourceDay === targetDayNum) {
      handleDragEnd();
      return;
    }

    // Optimistic update
    const updatedPois = planPois.map(poi => 
      poi.id === draggedPoi.id 
        ? { ...poi, day: targetDayNum, position: 0 }
        : poi
    );
    
    // Recalculer les positions pour le jour source et cible
    const finalPois = recalculatePositions(updatedPois, sourceDay, targetDayNum);
    setPlanPois(finalPois);

    // Sync backend
    const success = await updatePoiPosition(draggedPoi.id, targetDayNum, 0);
    
    if (!success) {
      // Rollback
      setPlanPois(previousStateRef.current);
    }
    
    handleDragEnd();
  };

  const handleDropOnIndex = async (e, targetDay, targetIndex) => {
    e.preventDefault();
    setDragOverDay(null);
    setDragOverIndex(null);
    
    if (!draggedPoi) return;

    const sourceDay = draggedPoi.day || 0;
    
    // No-op si même position
    if (sourceDay === targetDay && draggedPoi.position === targetIndex) {
      handleDragEnd();
      return;
    }

    // Optimistic update
    let updatedPois = [...planPois];
    
    // Retirer le POI de sa position actuelle
    updatedPois = updatedPois.filter(poi => poi.id !== draggedPoi.id);
    
    // Ajouter le POI à la nouvelle position
    const updatedPoi = { ...draggedPoi, day: targetDay, position: targetIndex };
    
    // Insérer à la bonne position
    const beforeTarget = updatedPois.filter(poi => 
      (poi.day || 0) === targetDay && poi.position < targetIndex
    );
    const afterTarget = updatedPois.filter(poi => 
      (poi.day || 0) === targetDay && poi.position >= targetIndex
    );
    
    const finalPois = [
      ...beforeTarget,
      updatedPoi,
      ...afterTarget.map(poi => ({ ...poi, position: poi.position + 1 }))
    ];

    setPlanPois(finalPois);

    // Sync backend
    const success = await updatePoiPosition(draggedPoi.id, targetDay, targetIndex);
    
    if (!success) {
      // Rollback
      setPlanPois(previousStateRef.current);
    } else {
      // Mettre à jour les autres positions du jour si nécessaire
      const poisToUpdate = finalPois.filter(poi => 
        (poi.day || 0) === targetDay && poi.id !== draggedPoi.id
      );
      
      for (const poi of poisToUpdate) {
        await updatePoiPosition(poi.id, poi.day, poi.position);
      }
    }
    
    handleDragEnd();
  };

  const recalculatePositions = (pois, sourceDay, targetDay) => {
    const result = [...pois];
    
    // Recalculer positions pour le jour source
    const sourcePois = result.filter(poi => (poi.day || 0) === sourceDay)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    sourcePois.forEach((poi, index) => {
      const poiIndex = result.findIndex(p => p.id === poi.id);
      if (poiIndex !== -1) {
        result[poiIndex] = { ...poi, position: index };
      }
    });
    
    // Recalculer positions pour le jour cible
    const targetPois = result.filter(poi => (poi.day || 0) === targetDay)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    targetPois.forEach((poi, index) => {
      const poiIndex = result.findIndex(p => p.id === poi.id);
      if (poiIndex !== -1) {
        result[poiIndex] = { ...poi, position: index };
      }
    });
    
    return result;
  };

  return {
    draggedPoi,
    dragOverDay,
    dragOverIndex,
    dragActive,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDropOnDay,
    handleDropOnIndex
  };
}
