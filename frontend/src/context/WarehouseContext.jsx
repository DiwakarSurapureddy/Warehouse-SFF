import React, { createContext, useContext, useState } from 'react';

const WarehouseContext = createContext(null);

export const WarehouseProvider = ({ children }) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <WarehouseContext.Provider value={{ selectedWarehouseId, setSelectedWarehouseId, refreshTrigger, triggerRefresh }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => useContext(WarehouseContext);
