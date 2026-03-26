package com.geotrade.backend.repository;

import com.geotrade.backend.model.Negocio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NegocioRepository extends JpaRepository<Negocio, Long> {
    
    /**
     * Busca negocios por el ID del usuario.
     * Spring mapea "IdUsuario" a la propiedad "idUsuario" de la entidad Negocio.
     */
    List<Negocio> findByIdUsuario(Long idUsuario);
}