package com.geotrade.backend.repository;

import com.geotrade.backend.model.Opinion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpinionRepository extends JpaRepository<Opinion, Long> {

    List<Opinion> findByLugarId(String lugarId);

    List<Opinion> findByUsuarioId(Long usuarioId);
}