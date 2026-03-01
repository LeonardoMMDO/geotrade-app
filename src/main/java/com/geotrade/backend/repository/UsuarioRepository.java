package com.geotrade.backend.repository;

import com.geotrade.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Para el login y recuperación
    List<Usuario> findByCorreoIgnoreCase(String correo);
    
    // Cambia esto para que sea consistente
    Optional<Usuario> findByTelefono(String telefono);

    boolean existsByCorreoIgnoreCase(String correo);
    
    // Asegúrate de que este método exista tal cual
    boolean existsByTelefono(String telefono);
}