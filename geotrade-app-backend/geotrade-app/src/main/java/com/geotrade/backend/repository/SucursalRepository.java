package com.geotrade.backend.repository;

import com.geotrade.backend.model.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SucursalRepository extends JpaRepository<Sucursal, Long> {
        List<Sucursal> findByNegocio_IdOrderByIdSucursalAsc(Long idNegocio);
}
